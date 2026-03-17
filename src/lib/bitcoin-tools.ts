export type BitcoinScriptProfile = 'p2wpkh' | 'p2tr' | 'p2sh-segwit' | 'legacy';

export const BITCOIN_SCRIPT_PROFILES: Record<
  BitcoinScriptProfile,
  {
    label: string;
    shortLabel: string;
    inputVbytes: number;
    outputVbytes: number;
  }
> = {
  p2wpkh: {
    label: 'Native SegWit (P2WPKH)',
    shortLabel: 'SegWit',
    inputVbytes: 68,
    outputVbytes: 31,
  },
  p2tr: {
    label: 'Taproot (P2TR)',
    shortLabel: 'Taproot',
    inputVbytes: 58,
    outputVbytes: 43,
  },
  'p2sh-segwit': {
    label: 'Nested SegWit (P2SH-P2WPKH)',
    shortLabel: 'Nested',
    inputVbytes: 91,
    outputVbytes: 32,
  },
  legacy: {
    label: 'Legacy (P2PKH)',
    shortLabel: 'Legacy',
    inputVbytes: 148,
    outputVbytes: 34,
  },
};

const TX_OVERHEAD_VBYTES = 10.5;

export function clampCount(
  raw: string | number,
  fallback: number,
  min = 1,
  max = 1000
): number {
  const parsed = Number(typeof raw === 'string' ? raw.replace(/,/g, '').trim() : raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

export function clampFeeRate(
  raw: string | number,
  fallback: number,
  min = 0,
  max = 10_000
): number {
  const parsed = Number(typeof raw === 'string' ? raw.replace(/,/g, '').trim() : raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function estimateTransactionVbytes(input: {
  inputCount: number;
  outputCount: number;
  inputProfile: BitcoinScriptProfile;
  outputProfile: BitcoinScriptProfile;
}): number {
  const inputVbytes = BITCOIN_SCRIPT_PROFILES[input.inputProfile].inputVbytes;
  const outputVbytes = BITCOIN_SCRIPT_PROFILES[input.outputProfile].outputVbytes;

  return Math.ceil(
    TX_OVERHEAD_VBYTES +
      input.inputCount * inputVbytes +
      input.outputCount * outputVbytes
  );
}

export function satsForFeeRate(vbytes: number, feeRate: number): number {
  return Math.ceil(vbytes * feeRate);
}

export function estimateRbfReplacement(input: {
  vbytes: number;
  currentFeeRate: number;
  targetFeeRate: number;
}) {
  const currentFeeSats = satsForFeeRate(input.vbytes, input.currentFeeRate);
  const replacementFeeSats = satsForFeeRate(input.vbytes, input.targetFeeRate);

  return {
    currentFeeSats,
    replacementFeeSats,
    additionalFeeSats: Math.max(replacementFeeSats - currentFeeSats, 0),
  };
}

export function estimateCpfpPackage(input: {
  parentVbytes: number;
  parentFeeRate: number;
  childVbytes: number;
  targetPackageFeeRate: number;
}) {
  const parentFeeSats = satsForFeeRate(input.parentVbytes, input.parentFeeRate);
  const requiredPackageFeeSats = satsForFeeRate(
    input.parentVbytes + input.childVbytes,
    input.targetPackageFeeRate
  );
  const childFeeSats = Math.max(requiredPackageFeeSats - parentFeeSats, 0);

  return {
    parentFeeSats,
    requiredPackageFeeSats,
    childFeeSats,
    childFeeRate:
      input.childVbytes > 0 ? childFeeSats / input.childVbytes : 0,
  };
}
