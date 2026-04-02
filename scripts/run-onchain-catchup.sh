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
CATCHUP_WINDOW_SIZE="${BITFLOW_CATCHUP_WINDOW_SIZE:-500}"
CATCHUP_WORKERS="${BITFLOW_CATCHUP_WORKERS:-4}"
RAW_RETENTION_BLOCKS="${BITFLOW_RAW_RETENTION_BLOCKS:-14400}"

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

find_catchup_start_height() {
  local floor_height="$1"
  local tip_height="$2"

  "$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "
    WITH bounds AS (
      SELECT GREATEST(${floor_height}, 0)::BIGINT AS floor_height
    ),
    indexed AS (
      SELECT height
      FROM btc_blocks
      WHERE height >= (SELECT floor_height FROM bounds)
        AND height <= ${tip_height}
    ),
    first_present AS (
      SELECT MIN(height) AS min_height, MAX(height) AS max_height
      FROM indexed
    ),
    first_gap AS (
      SELECT MIN(prev_height + 1) AS missing_height
      FROM (
        SELECT height, LAG(height) OVER (ORDER BY height) AS prev_height
        FROM indexed
      ) gaps
      WHERE prev_height IS NOT NULL
        AND height > prev_height + 1
    ),
    contiguous AS (
      SELECT CASE
        WHEN (SELECT min_height FROM first_present) IS NULL
          THEN (SELECT floor_height FROM bounds) - 1
        WHEN (SELECT min_height FROM first_present) > (SELECT floor_height FROM bounds)
          THEN (SELECT floor_height FROM bounds) - 1
        WHEN (SELECT missing_height FROM first_gap) IS NOT NULL
          THEN (SELECT missing_height FROM first_gap) - 1
        ELSE (SELECT max_height FROM first_present)
      END AS contiguous_height
    )
    SELECT GREATEST(
      COALESCE((SELECT contiguous_height FROM contiguous), (SELECT floor_height FROM bounds) - 1) + 1,
      (SELECT floor_height FROM bounds)
    );
  " 2>/dev/null || echo -1
}

find_metrics_recalc_window() {
  local start_height="$1"
  local end_height="$2"

  "$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "
    SELECT
      COALESCE(MIN(block_time::date)::text, ''),
      COALESCE(MAX(block_time::date)::text, '')
    FROM btc_blocks
    WHERE height BETWEEN ${start_height} AND ${end_height};
  " 2>/dev/null || true
}

compute_raw_retention_floor() {
  local prune_height="$1"
  local tip_height="$2"
  local floor_height="$prune_height"

  if [[ "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] && (( RAW_RETENTION_BLOCKS > 0 )); then
    local candidate_floor=$(( tip_height - RAW_RETENTION_BLOCKS + 1 ))
    if (( candidate_floor > floor_height )); then
      floor_height=$candidate_floor
    fi
  fi

  printf '%s\n' "$floor_height"
}

while true; do
  chain_info="$(bitcoin_rpc_call "getblockchaininfo" 2>/dev/null || true)"
  current_tip="$(jq -r '.result.blocks // empty' <<<"$chain_info" 2>/dev/null || true)"
  prune_height="$(jq -r '.result.pruneheight // 0' <<<"$chain_info" 2>/dev/null || echo 0)"
  if [[ ! "$current_tip" =~ ^[0-9]+$ ]] || [[ ! "$prune_height" =~ ^[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  if [[ ! "$CATCHUP_WINDOW_SIZE" =~ ^[0-9]+$ ]] || (( CATCHUP_WINDOW_SIZE < 1 )); then
    sleep 60
    continue
  fi

  if [[ ! "$CATCHUP_WORKERS" =~ ^[0-9]+$ ]] || (( CATCHUP_WORKERS < 1 )); then
    sleep 60
    continue
  fi

  if [[ ! "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]] || (( RAW_RETENTION_BLOCKS < 1 )); then
    sleep 60
    continue
  fi

  raw_floor_height="$(compute_raw_retention_floor "$prune_height" "$current_tip")"
  start_height="$(find_catchup_start_height "$raw_floor_height" "$current_tip")"
  if [[ ! "$start_height" =~ ^-?[0-9]+$ ]]; then
    sleep 30
    continue
  fi

  if (( start_height < raw_floor_height )); then
    printf '%s prune gap detected, advancing catchup floor %s->%s\n' \
      "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$raw_floor_height"
    start_height=$raw_floor_height
  fi

  if (( current_tip >= start_height )); then
    end_height=$current_tip
    chunk_end_height=$(( start_height + CATCHUP_WINDOW_SIZE - 1 ))
    if (( chunk_end_height < end_height )); then
      end_height=$chunk_end_height
    fi

    range_size=$(( end_height - start_height + 1 ))
    worker_count=$CATCHUP_WORKERS
    if (( worker_count > range_size )); then
      worker_count=$range_size
    fi
    if (( worker_count < 1 )); then
      worker_count=1
    fi

    chunk_size=$(( (range_size + worker_count - 1) / worker_count ))
    printf '%s catchup backfill %s-%s workers=%s chunk=%s\n' \
      "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$end_height" "$worker_count" "$chunk_size"

    pids=()
    worker_failed=0
    worker_index=0
    worker_start=$start_height
    while (( worker_start <= end_height )); do
      worker_end=$(( worker_start + chunk_size - 1 ))
      if (( worker_end > end_height )); then
        worker_end=$end_height
      fi

      "$PYTHON_BIN" -m bitflow_onchain.main backfill \
        --pipeline-name "backfill-${worker_index}" \
        --start-height "$worker_start" \
        --end-height "$worker_end" \
        --batch-size 200 &
      pids+=("$!")

      worker_index=$(( worker_index + 1 ))
      worker_start=$(( worker_end + 1 ))
    done

    for pid in "${pids[@]}"; do
      if ! wait "$pid"; then
        worker_failed=1
      fi
    done

    if (( worker_failed != 0 )); then
      printf '%s catchup backfill failed for %s-%s, will retry next cycle\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$start_height" "$end_height"
      node "$SYNC_BIN" || true
      sleep 60
      continue
    fi

    next_start_height="$(find_catchup_start_height "$raw_floor_height" "$current_tip")"
    if [[ "$next_start_height" =~ ^-?[0-9]+$ ]]; then
      contiguous_height=$(( next_start_height - 1 ))
      if (( contiguous_height >= start_height )); then
        recalc_window="$(find_metrics_recalc_window "$start_height" "$contiguous_height")"
        IFS='|' read -r recalc_start_day recalc_end_day <<<"$recalc_window"
        if [[ -n "$recalc_start_day" && -n "$recalc_end_day" ]]; then
          "$PYTHON_BIN" -m bitflow_onchain.main metrics-range \
            --start-date "$recalc_start_day" \
            --end-date "$recalc_end_day" || true
        fi
      fi
    fi
  fi

  node "$SYNC_BIN" || true

  sleep 60
done
