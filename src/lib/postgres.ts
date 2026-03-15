import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __bitflowPgPool: Pool | undefined;
}

export function hasBitflowPgDsn(): boolean {
  return Boolean(process.env.BITFLOW_PG_DSN);
}

export function getBitflowPgPool(): Pool {
  const dsn = process.env.BITFLOW_PG_DSN;

  if (!dsn) {
    throw new Error('Missing BITFLOW_PG_DSN');
  }

  if (!globalThis.__bitflowPgPool) {
    globalThis.__bitflowPgPool = new Pool({
      connectionString: dsn,
      max: 4,
    });
  }

  return globalThis.__bitflowPgPool;
}
