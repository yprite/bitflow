export interface BitcoinTxStatusApiFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface BitcoinTxStatusApiTx {
  txid: string;
  fee: number;
  weight?: number | null;
  size?: number | null;
  vout?: Array<{ value?: number | null }>;
  status?: {
    confirmed?: boolean;
    block_height?: number | null;
    block_hash?: string | null;
    block_time?: number | null;
  } | null;
}

export interface BitcoinTxStatusSnapshot {
  txid: string;
  stage: 'mempool' | 'confirmed';
  stageLabel: string;
  stageSummary: string;
  feeSats: number;
  vsize: number;
  feeRate: number;
  totalOutputSats: number;
  blockHeight: number | null;
  blockHash: string | null;
  blockTime: string | null;
  confirmations: number | null;
  targetBand: 'next_block' | 'half_hour' | 'hour' | 'economy' | 'below_market' | null;
  targetLabel: string | null;
  targetSummary: string | null;
}

function toIsoTime(unixSeconds: number | null | undefined): string | null {
  if (typeof unixSeconds !== 'number' || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function sumOutputs(vout: BitcoinTxStatusApiTx['vout']): number {
  if (!Array.isArray(vout)) return 0;
  return vout.reduce((sum, output) => sum + (typeof output?.value === 'number' ? output.value : 0), 0);
}

function deriveVsize(tx: BitcoinTxStatusApiTx): number {
  if (typeof tx.weight === 'number' && Number.isFinite(tx.weight) && tx.weight > 0) {
    return Math.ceil(tx.weight / 4);
  }

  if (typeof tx.size === 'number' && Number.isFinite(tx.size) && tx.size > 0) {
    return tx.size;
  }

  return 0;
}

function deriveTargetBand(
  feeRate: number,
  fees: BitcoinTxStatusApiFees
): Pick<BitcoinTxStatusSnapshot, 'targetBand' | 'targetLabel' | 'targetSummary'> {
  if (feeRate >= fees.fastestFee) {
    return {
      targetBand: 'next_block',
      targetLabel: '다음 블록권',
      targetSummary: '현재 추천 fee 기준으로는 가장 빠른 블록 포함을 노릴 수 있는 구간입니다.',
    };
  }

  if (feeRate >= fees.halfHourFee) {
    return {
      targetBand: 'half_hour',
      targetLabel: '30분권',
      targetSummary: '빠른 확정보다는 한두 블록 여유를 두는 fee 구간으로 해석할 수 있습니다.',
    };
  }

  if (feeRate >= fees.hourFee) {
    return {
      targetBand: 'hour',
      targetLabel: '1시간권',
      targetSummary: '즉시 확정보다는 느리지만, 시장 평균 fee range 안에는 들어와 있습니다.',
    };
  }

  if (feeRate >= fees.economyFee) {
    return {
      targetBand: 'economy',
      targetLabel: '저우선권',
      targetSummary: '네트워크가 한산해야 들어갈 수 있는 낮은 fee 구간입니다.',
    };
  }

  return {
    targetBand: 'below_market',
    targetLabel: '시장 하단 이하',
    targetSummary: '현재 추천 fee보다 낮아 mempool에 오래 남거나 replacement가 필요할 수 있습니다.',
  };
}

export function deriveBitcoinTxStatusSnapshot(input: {
  tx: BitcoinTxStatusApiTx;
  tipHeight: number;
  fees: BitcoinTxStatusApiFees;
}): BitcoinTxStatusSnapshot {
  const { tx, tipHeight, fees } = input;
  const status = tx.status ?? {};
  const confirmed = status.confirmed === true;
  const vsize = deriveVsize(tx);
  const feeSats = typeof tx.fee === 'number' && Number.isFinite(tx.fee) ? tx.fee : 0;
  const feeRate = vsize > 0 ? feeSats / vsize : 0;
  const totalOutputSats = sumOutputs(tx.vout);
  const blockHeight =
    typeof status.block_height === 'number' && Number.isFinite(status.block_height)
      ? status.block_height
      : null;
  const confirmations =
    confirmed && blockHeight !== null && tipHeight > 0
      ? Math.max(tipHeight - blockHeight + 1, 1)
      : null;
  const target = confirmed ? {
    targetBand: null,
    targetLabel: null,
    targetSummary: null,
  } : deriveTargetBand(feeRate, fees);

  if (confirmed) {
    const stageLabel = confirmations !== null && confirmations >= 6 ? '확정 완료' : '블록 포함';
    const stageSummary =
      confirmations !== null && confirmations >= 6
        ? `${confirmations} confirmations 상태로, 일반적인 상거래 기준에선 최종 확정으로 봐도 되는 구간입니다.`
        : `${confirmations ?? 1} confirmations 상태입니다. 블록에는 포함됐지만 추가 블록이 더 쌓일 수 있습니다.`;

    return {
      txid: tx.txid,
      stage: 'confirmed',
      stageLabel,
      stageSummary,
      feeSats,
      vsize,
      feeRate,
      totalOutputSats,
      blockHeight,
      blockHash: typeof status.block_hash === 'string' ? status.block_hash : null,
      blockTime: toIsoTime(status.block_time),
      confirmations,
      targetBand: null,
      targetLabel: null,
      targetSummary: null,
    };
  }

  return {
    txid: tx.txid,
    stage: 'mempool',
    stageLabel: 'mempool 대기',
    stageSummary:
      '공개 mempool 인덱스에서 발견된 상태입니다. 네트워크 노드가 형식과 정책 검사를 통과시켜 중계 중이며, 아직 블록에는 포함되지 않았습니다.',
    feeSats,
    vsize,
    feeRate,
    totalOutputSats,
    blockHeight: null,
    blockHash: null,
    blockTime: null,
    confirmations: null,
    targetBand: target.targetBand,
    targetLabel: target.targetLabel,
    targetSummary: target.targetSummary,
  };
}
