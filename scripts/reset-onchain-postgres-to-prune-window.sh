#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_ENV="$ROOT_DIR/python/.env"
LOCAL_ENV="$ROOT_DIR/.env.local"
BITCOIN_CLI_BIN="${BITCOIN_CLI_BIN:-/opt/homebrew/bin/bitcoin-cli}"
BITCOIN_CONF_PATH="${BITCOIN_CONF_PATH:-$HOME/Library/Application Support/Bitcoin/bitcoin.conf}"
PSQL_BIN="${PSQL_BIN:-/opt/homebrew/opt/postgresql@17/bin/psql}"
DROPDB_BIN="${DROPDB_BIN:-/opt/homebrew/opt/postgresql@17/bin/dropdb}"
CREATEDB_BIN="${CREATEDB_BIN:-/opt/homebrew/opt/postgresql@17/bin/createdb}"
DB_NAME="${DB_NAME:-bitflow_onchain}"
RAW_RETENTION_BLOCKS="${BITFLOW_RAW_RETENTION_BLOCKS:-14400}"
SKIP_PREVOUT_SNAPSHOT="${BITFLOW_RESET_SKIP_PREVOUT_SNAPSHOT:-1}"
SCHEMA_FILES=(
  "$ROOT_DIR/supabase/migrations/004_btc_onchain.sql"
  "$ROOT_DIR/supabase/migrations/007_onchain_prevout_snapshot_retention.sql"
  "$ROOT_DIR/supabase/migrations/008_btc_prevout_snapshots.sql"
)

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

if ! [[ -x "$BITCOIN_CLI_BIN" ]]; then
  echo "bitcoin-cli not found at $BITCOIN_CLI_BIN"
  exit 1
fi

if ! [[ -x "$PSQL_BIN" && -x "$DROPDB_BIN" && -x "$CREATEDB_BIN" ]]; then
  echo "postgres client binaries are missing"
  exit 1
fi

for schema_file in "${SCHEMA_FILES[@]}"; do
  if [[ ! -f "$schema_file" ]]; then
    echo "schema file is missing: $schema_file"
    exit 1
  fi
done

chain_info="$("$BITCOIN_CLI_BIN" -conf="$BITCOIN_CONF_PATH" getblockchaininfo)"
prune_height="$(jq -r 'if .pruned then (.pruneheight // 0) else 0 end' <<<"$chain_info")"
tip_height="$(jq -r '.blocks // 0' <<<"$chain_info")"

if ! [[ "$prune_height" =~ ^[0-9]+$ && "$tip_height" =~ ^[0-9]+$ ]]; then
  echo "failed to read prune/tip height from bitcoin-cli"
  exit 1
fi

if ! [[ "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] || (( RAW_RETENTION_BLOCKS < 1 )); then
  echo "BITFLOW_RAW_RETENTION_BLOCKS must be a positive integer"
  exit 1
fi

if [[ "$SKIP_PREVOUT_SNAPSHOT" != "0" && "$SKIP_PREVOUT_SNAPSHOT" != "1" ]]; then
  echo "BITFLOW_RESET_SKIP_PREVOUT_SNAPSHOT must be 0 or 1"
  exit 1
fi

retention_height=$prune_height
candidate_retention_height=$(( tip_height - RAW_RETENTION_BLOCKS + 1 ))
if (( candidate_retention_height > retention_height )); then
  retention_height=$candidate_retention_height
fi

snapshot_file="$(mktemp -t bitflow-prevout-snapshots.XXXXXX.csv.gz)"
trap 'rm -f "$snapshot_file"' EXIT

db_exists="$("$PSQL_BIN" postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")"
snapshot_rows=0
if [[ "$db_exists" == "1" && "$SKIP_PREVOUT_SNAPSHOT" != "1" ]]; then
  snapshot_table_exported="$("$PSQL_BIN" -d "$DB_NAME" -Atqc "SELECT to_regclass('public.btc_outputs') IS NOT NULL")"
  if [[ "$snapshot_table_exported" == "t" ]]; then
    "$PSQL_BIN" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "\copy (
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
    ) TO STDOUT WITH (FORMAT csv)" | gzip -c > "$snapshot_file"
    snapshot_rows="$(gzip -dc "$snapshot_file" | wc -l | tr -d ' ')"
  fi
fi

"$PSQL_BIN" postgres -v ON_ERROR_STOP=1 -qc "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
"

"$DROPDB_BIN" --if-exists "$DB_NAME"
"$CREATEDB_BIN" "$DB_NAME"
for schema_file in "${SCHEMA_FILES[@]}"; do
  "$PSQL_BIN" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$schema_file" >/dev/null
done

if [[ -s "$snapshot_file" ]]; then
  gzip -dc "$snapshot_file" | "$PSQL_BIN" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "\copy btc_prevout_snapshots (
    txid,
    vout_n,
    block_height,
    block_time,
    value_sats,
    script_pubkey,
    script_type,
    address,
    descriptor
  ) FROM STDIN WITH (FORMAT csv)" >/dev/null
fi

echo "reset local on-chain database"
echo "database=${DB_NAME}"
echo "prune_height=${prune_height}"
echo "tip_height=${tip_height}"
echo "retention_height=${retention_height}"
echo "snapshot_rows=${snapshot_rows}"
echo "skip_prevout_snapshot=${SKIP_PREVOUT_SNAPSHOT}"
