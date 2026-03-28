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
SCHEMA_SQL="$ROOT_DIR/supabase/migrations/004_btc_onchain.sql"

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

if ! [[ -x "$BITCOIN_CLI_BIN" && -x "$PSQL_BIN" && -x "$DROPDB_BIN" && -x "$CREATEDB_BIN" ]]; then
  echo "reset dependencies are missing"
  exit 1
fi

if [[ ! -f "$SCHEMA_SQL" ]]; then
  echo "schema file is missing: $SCHEMA_SQL"
  exit 1
fi

if ! [[ "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] || (( RAW_RETENTION_BLOCKS < 1 )); then
  echo "BITFLOW_RAW_RETENTION_BLOCKS must be a positive integer"
  exit 1
fi

chain_info="$("$BITCOIN_CLI_BIN" -conf="$BITCOIN_CONF_PATH" getblockchaininfo)"
prune_height="$(jq -r 'if .pruned then (.pruneheight // 0) else 0 end' <<<"$chain_info")"
tip_height="$(jq -r '.blocks // 0' <<<"$chain_info")"

if ! [[ "$prune_height" =~ ^[0-9]+$ && "$tip_height" =~ ^[0-9]+$ ]]; then
  echo "failed to read prune/tip height from bitcoin-cli"
  exit 1
fi

retention_height=$prune_height
candidate_retention_height=$(( tip_height - RAW_RETENTION_BLOCKS + 1 ))
if (( candidate_retention_height > retention_height )); then
  retention_height=$candidate_retention_height
fi

"$PSQL_BIN" postgres -v ON_ERROR_STOP=1 -qc "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
"

"$DROPDB_BIN" --if-exists "$DB_NAME"
"$CREATEDB_BIN" "$DB_NAME"
"$PSQL_BIN" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SCHEMA_SQL" >/dev/null

echo "reset local on-chain database"
echo "database=${DB_NAME}"
echo "prune_height=${prune_height}"
echo "tip_height=${tip_height}"
echo "retention_height=${retention_height}"
