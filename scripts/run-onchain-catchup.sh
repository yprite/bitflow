#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_DIR="$ROOT_DIR/python"
PYTHON_BIN="$PYTHON_DIR/.venv/bin/python"
PSQL_BIN="/opt/homebrew/opt/postgresql@17/bin/psql"
SYNC_BIN="$ROOT_DIR/scripts/sync-onchain-to-supabase.mjs"

cd "$PYTHON_DIR"
set -a
source "$PYTHON_DIR/.env"
set +a

export PYTHONPATH="$PYTHON_DIR/src"
export PYTHONUNBUFFERED=1

while true; do
  chain_info="$(bitcoin-cli -rpcuser="$BITCOIN_RPC_USER" -rpcpassword="$BITCOIN_RPC_PASSWORD" getblockchaininfo 2>/dev/null || true)"
  current_tip="$(jq -r '.blocks // empty' <<<"$chain_info" 2>/dev/null || true)"
  prune_height="$(jq -r '.pruneheight // 0' <<<"$chain_info" 2>/dev/null || echo 0)"
  if [[ ! "$current_tip" =~ ^[0-9]+$ ]] || [[ ! "$prune_height" =~ ^[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  last_height="$("$PSQL_BIN" -d bitflow_onchain -Atqc "SELECT COALESCE(MAX(height), -1) FROM btc_blocks" 2>/dev/null || echo -1)"
  if [[ ! "$last_height" =~ ^-?[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  start_height=$(( last_height + 1 ))
  if (( start_height < prune_height )); then
    printf '%s prune gap detected, advancing catchup floor %s->%s\n' \
      "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$prune_height"
    start_height=$prune_height
  fi

  if (( current_tip >= start_height )); then
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

  node "$SYNC_BIN" || true

  sleep 60
done
