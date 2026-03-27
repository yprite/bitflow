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

if ! [[ -x "$BITCOIN_CLI_BIN" && -x "$PSQL_BIN" ]]; then
  echo "retention dependencies are missing"
  exit 1
fi

if ! [[ "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] || (( RAW_RETENTION_BLOCKS < 1 )); then
  echo "BITFLOW_RAW_RETENTION_BLOCKS must be a positive integer"
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

if (( before_min_height == -1 )) || (( before_min_height >= retention_height )); then
  echo "retention not needed; current minimum height=$before_min_height retention_height=$retention_height prune_height=$prune_height"
  exit 0
fi

deleted_blocks="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -Atqc "
  WITH deleted_blocks AS (
    DELETE FROM btc_blocks
    WHERE height < ${retention_height}
    RETURNING 1
  )
  SELECT COALESCE(COUNT(*), 0) FROM deleted_blocks;
")"

"$PSQL_BIN" "$BITFLOW_PG_DSN" -v ON_ERROR_STOP=1 -qc "
  VACUUM (ANALYZE) btc_blocks;
  VACUUM (ANALYZE) btc_txs;
  VACUUM (ANALYZE) btc_outputs;
  VACUUM (ANALYZE) btc_inputs;
  VACUUM (ANALYZE) btc_spent_edges;
  VACUUM (ANALYZE) btc_daily_metrics;
  VACUUM (ANALYZE) btc_entity_flow_daily;
  VACUUM (ANALYZE) btc_alert_events;
"

after_min_height="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT COALESCE(MIN(height), -1) FROM btc_blocks")"
after_db_size="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT pg_database_size(current_database())")"

python3 - <<'PY' "$deleted_blocks" "$before_db_size" "$after_db_size" "$before_min_height" "$after_min_height" "$prune_height" "$retention_height"
import sys

deleted_blocks = int(sys.argv[1])
before_db_size = int(sys.argv[2])
after_db_size = int(sys.argv[3])
before_min_height = int(sys.argv[4])
after_min_height = int(sys.argv[5])
prune_height = int(sys.argv[6])
retention_height = int(sys.argv[7])

def gib(value: int) -> str:
    return f"{value / 1024 / 1024 / 1024:.1f} GiB"

print(
    "retention pruned",
    f"deleted_blocks={deleted_blocks}",
    f"before_min_height={before_min_height}",
    f"after_min_height={after_min_height}",
    f"prune_height={prune_height}",
    f"retention_height={retention_height}",
    f"before_db_size={gib(before_db_size)}",
    f"after_db_size={gib(after_db_size)}",
)
PY
