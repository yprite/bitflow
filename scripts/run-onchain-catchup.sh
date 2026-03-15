#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_DIR="$ROOT_DIR/python"
PYTHON_BIN="$PYTHON_DIR/.venv/bin/python"
PSQL_BIN="/opt/homebrew/opt/postgresql@17/bin/psql"

cd "$PYTHON_DIR"
set -a
source "$PYTHON_DIR/.env"
set +a

export PYTHONPATH="$PYTHON_DIR/src"
export PYTHONUNBUFFERED=1

while true; do
  current_tip="$(bitcoin-cli -rpcuser="$BITCOIN_RPC_USER" -rpcpassword="$BITCOIN_RPC_PASSWORD" getblockcount 2>/dev/null || true)"
  if [[ ! "$current_tip" =~ ^[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  last_height="$("$PSQL_BIN" -d bitflow_onchain -Atqc "SELECT COALESCE(MAX(height), -1) FROM btc_blocks" 2>/dev/null || echo -1)"
  if [[ ! "$last_height" =~ ^-?[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  if (( current_tip > last_height )); then
    start_height=$(( last_height + 1 ))
    end_height=$current_tip
    printf '%s catchup backfill %s-%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$end_height"
    "$PYTHON_BIN" -m bitflow_onchain.main backfill \
      --start-height "$start_height" \
      --end-height "$end_height" \
      --batch-size 200

    latest_day="$("$PSQL_BIN" -d bitflow_onchain -Atqc "SELECT COALESCE(MAX(block_time::date)::text, '') FROM btc_blocks" 2>/dev/null || true)"
    if [[ -n "$latest_day" ]]; then
      "$PYTHON_BIN" -m bitflow_onchain.main metrics --date "$latest_day" || true
    fi
  fi

  sleep 60
done
