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
RPC_TIMEOUT_SECONDS="${BITCOIN_RPC_TIMEOUT_SECONDS:-30}"

bitcoin_rpc_call() {
  local method="$1"
  curl \
    --silent \
    --show-error \
    --max-time "$RPC_TIMEOUT_SECONDS" \
    --user "$BITCOIN_RPC_USER:$BITCOIN_RPC_PASSWORD" \
    --header "Content-Type: application/json" \
    --data-binary "{\"jsonrpc\":\"2.0\",\"id\":\"$method\",\"method\":\"$method\",\"params\":[]}" \
    "$BITCOIN_RPC_URL"
}

while true; do
  chain_info="$(bitcoin_rpc_call "getblockchaininfo" 2>/dev/null || true)"
  current_tip="$(jq -r '.result.blocks // empty' <<<"$chain_info" 2>/dev/null || true)"
  prune_height="$(jq -r '.result.pruneheight // 0' <<<"$chain_info" 2>/dev/null || echo 0)"
  if [[ ! "$current_tip" =~ ^[0-9]+$ ]] || [[ ! "$prune_height" =~ ^[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  last_height="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT COALESCE(MAX(height), -1) FROM btc_blocks" 2>/dev/null || echo -1)"
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
    if ! "$PYTHON_BIN" -m bitflow_onchain.main backfill \
      --start-height "$start_height" \
      --end-height "$end_height" \
      --batch-size 200; then
      printf '%s catchup backfill failed for %s-%s, will retry next cycle\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$end_height"
      node "$SYNC_BIN" || true
      sleep 60
      continue
    fi

    latest_day="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT COALESCE(MAX(block_time::date)::text, '') FROM btc_blocks" 2>/dev/null || true)"
    if [[ -n "$latest_day" ]]; then
      "$PYTHON_BIN" -m bitflow_onchain.main metrics --date "$latest_day" || true
    fi
  fi

  node "$SYNC_BIN" || true

  sleep 60
done
