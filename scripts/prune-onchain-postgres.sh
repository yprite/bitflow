#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_ENV="$ROOT_DIR/python/.env"
LOCAL_ENV="$ROOT_DIR/.env.local"
LOCK_ROOT="$ROOT_DIR/.locks"
LOCK_DIR="$LOCK_ROOT/onchain-retention.lock"
BITCOIN_CLI_BIN="${BITCOIN_CLI_BIN:-/opt/homebrew/bin/bitcoin-cli}"
BITCOIN_CONF_PATH="${BITCOIN_CONF_PATH:-$HOME/Library/Application Support/Bitcoin/bitcoin.conf}"
PSQL_BIN="${PSQL_BIN:-/opt/homebrew/opt/postgresql@17/bin/psql}"
RAW_RETENTION_BLOCKS="${BITFLOW_RAW_RETENTION_BLOCKS:-14400}"
ENABLE_PREVOUT_SNAPSHOT="${BITFLOW_ENABLE_PREVOUT_SNAPSHOT:-0}"

mkdir -p "$LOCK_ROOT"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "onchain retention already running; skipping"
  exit 0
fi
trap 'rmdir "$LOCK_DIR"' EXIT

if [[ -f "$PYTHON_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$PYTHON_ENV"
  set +a
fi

if [[ -f "$LOCAL_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$LOCAL_ENV"
  set +a
fi

if [[ -z "${BITFLOW_PG_DSN:-}" ]]; then
  echo "BITFLOW_PG_DSN is not configured; skipping retention"
  exit 0
fi

if ! [[ -x "$BITCOIN_CLI_BIN" ]]; then
  echo "bitcoin-cli not found at $BITCOIN_CLI_BIN"
  exit 1
fi

if ! [[ -x "$PSQL_BIN" ]]; then
  echo "psql not found at $PSQL_BIN"
  exit 1
fi

if ! "$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT 1" >/dev/null 2>&1; then
  echo "local on-chain database is unavailable; skipping retention"
  exit 0
fi

chain_info="$("$BITCOIN_CLI_BIN" -conf="$BITCOIN_CONF_PATH" getblockchaininfo)"
prune_height="$(jq -r 'if .pruned then (.pruneheight // 0) else 0 end' <<<"$chain_info")"
tip_height="$(jq -r '.blocks // 0' <<<"$chain_info")"
if ! [[ "$prune_height" =~ ^[0-9]+$ ]] || ! [[ "$tip_height" =~ ^[0-9]+$ ]] || (( prune_height <= 0 )); then
  echo "node prune height is unavailable; skipping retention"
  exit 0
fi

if ! [[ "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] || (( RAW_RETENTION_BLOCKS < 1 )); then
  echo "BITFLOW_RAW_RETENTION_BLOCKS must be a positive integer"
  exit 1
fi

if [[ "$ENABLE_PREVOUT_SNAPSHOT" != "0" && "$ENABLE_PREVOUT_SNAPSHOT" != "1" ]]; then
  echo "BITFLOW_ENABLE_PREVOUT_SNAPSHOT must be 0 or 1"
  exit 1
fi

retention_height=$prune_height
candidate_retention_height=$(( tip_height - RAW_RETENTION_BLOCKS + 1 ))
if (( candidate_retention_height > retention_height )); then
  retention_height=$candidate_retention_height
fi

table_exists="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT to_regclass('public.btc_blocks') IS NOT NULL")"
if [[ "$table_exists" != "t" ]]; then
  echo "btc_blocks table is missing; skipping retention"
  exit 0
fi

before_min_height="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT COALESCE(MIN(height), -1) FROM btc_blocks")"
before_db_size="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT pg_database_size(current_database())")"

if ! [[ "$before_min_height" =~ ^-?[0-9]+$ ]]; then
  echo "failed to read current minimum block height"
  exit 1
fi

if (( before_min_height == -1 )) || (( before_min_height >= retention_height )); then
  echo "retention not needed; current minimum height=$before_min_height retention_height=$retention_height prune_height=$prune_height"
  exit 0
fi

if [[ "$ENABLE_PREVOUT_SNAPSHOT" == "1" ]]; then
  IFS='|' read -r snapshotted_prevouts deleted_snapshot_rows deleted_blocks <<<"$("$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -Atqc "
    BEGIN;

    CREATE TABLE IF NOT EXISTS btc_prevout_snapshots (
      txid TEXT NOT NULL,
      vout_n INTEGER NOT NULL,
      block_height BIGINT NOT NULL,
      block_time TIMESTAMPTZ NOT NULL,
      value_sats BIGINT NOT NULL,
      script_pubkey TEXT NOT NULL,
      script_type TEXT,
      address TEXT,
      descriptor TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (txid, vout_n)
    );

    CREATE INDEX IF NOT EXISTS idx_btc_prevout_snapshots_block_height
      ON btc_prevout_snapshots (block_height DESC);

    WITH deleted_snapshot_rows AS (
      DELETE FROM btc_prevout_snapshots snap
      USING btc_spent_edges se
      WHERE se.prev_txid = snap.txid
        AND se.prev_vout_n = snap.vout_n
      RETURNING 1
    ),
    inserted_snapshots AS (
      INSERT INTO btc_prevout_snapshots (
        txid,
        vout_n,
        block_height,
        block_time,
        value_sats,
        script_pubkey,
        script_type,
        address,
        descriptor
      )
      SELECT
        o.txid,
        o.vout_n,
        o.block_height,
        b.block_time,
        o.value_sats,
        o.script_pubkey,
        o.script_type,
        o.address,
        o.descriptor
      FROM btc_outputs o
      JOIN btc_blocks b
        ON b.height = o.block_height
      LEFT JOIN btc_spent_edges se
        ON se.prev_txid = o.txid
       AND se.prev_vout_n = o.vout_n
      WHERE o.block_height < ${retention_height}
        AND se.prev_txid IS NULL
      ON CONFLICT (txid, vout_n) DO NOTHING
      RETURNING 1
    ),
    deleted_blocks AS (
      DELETE FROM btc_blocks
      WHERE height < ${retention_height}
      RETURNING 1
    )
    SELECT
      COALESCE((SELECT COUNT(*) FROM inserted_snapshots), 0),
      COALESCE((SELECT COUNT(*) FROM deleted_snapshot_rows), 0),
      COALESCE((SELECT COUNT(*) FROM deleted_blocks), 0);

    COMMIT;
  ")"
else
  snapshotted_prevouts=0
  deleted_snapshot_rows=0
  deleted_blocks="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -Atqc "
    WITH deleted_blocks AS (
      DELETE FROM btc_blocks
      WHERE height < ${retention_height}
      RETURNING 1
    )
    SELECT COALESCE(COUNT(*), 0) FROM deleted_blocks;
  ")"
fi

for table_name in btc_blocks btc_txs btc_outputs btc_inputs btc_spent_edges; do
  "$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -qc "VACUUM (ANALYZE) ${table_name};"
done

if [[ "$ENABLE_PREVOUT_SNAPSHOT" == "1" ]]; then
  "$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -qc "VACUUM (ANALYZE) btc_prevout_snapshots;"
fi

after_min_height="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT COALESCE(MIN(height), -1) FROM btc_blocks")"
after_db_size="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT pg_database_size(current_database())")"

python3 - <<'PY' "$snapshotted_prevouts" "$deleted_snapshot_rows" "$deleted_blocks" "$before_db_size" "$after_db_size" "$before_min_height" "$after_min_height" "$prune_height" "$retention_height" "$ENABLE_PREVOUT_SNAPSHOT"
import sys

snapshotted_prevouts = int(sys.argv[1])
deleted_snapshot_rows = int(sys.argv[2])
deleted_blocks = int(sys.argv[3])
before_db_size = int(sys.argv[4])
after_db_size = int(sys.argv[5])
before_min_height = int(sys.argv[6])
after_min_height = int(sys.argv[7])
prune_height = int(sys.argv[8])
retention_height = int(sys.argv[9])
snapshot_enabled = sys.argv[10] == "1"

def gib(value: int) -> str:
    return f"{value / 1024 / 1024 / 1024:.1f} GiB"

print(
    "retention pruned",
    f"snapshotted_prevouts={snapshotted_prevouts}",
    f"deleted_snapshot_rows={deleted_snapshot_rows}",
    f"deleted_blocks={deleted_blocks}",
    f"before_min_height={before_min_height}",
    f"after_min_height={after_min_height}",
    f"prune_height={prune_height}",
    f"retention_height={retention_height}",
    f"snapshot_enabled={'yes' if snapshot_enabled else 'no'}",
    f"before_db_size={gib(before_db_size)}",
    f"after_db_size={gib(after_db_size)}",
)
PY
