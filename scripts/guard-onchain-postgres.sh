#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_ENV="$ROOT_DIR/python/.env"
LOCAL_ENV="$ROOT_DIR/.env.local"
LOCK_ROOT="$ROOT_DIR/.locks"
LOCK_DIR="$LOCK_ROOT/onchain-db-guard.lock"
PSQL_BIN="${PSQL_BIN:-/opt/homebrew/opt/postgresql@17/bin/psql}"
RESET_SCRIPT="$ROOT_DIR/scripts/reset-onchain-postgres-to-prune-window.sh"
RETENTION_SCRIPT="$ROOT_DIR/scripts/prune-onchain-postgres.sh"
LAUNCHCTL_BIN="${LAUNCHCTL_BIN:-/bin/launchctl}"
PLIST_DIR="$HOME/Library/LaunchAgents"
CATCHUP_PLIST="$PLIST_DIR/com.bitflow.onchain-catchup.plist"
REALTIME_PLIST="$PLIST_DIR/com.bitflow.onchain-realtime.plist"
RAW_RETENTION_BLOCKS="${BITFLOW_RAW_RETENTION_BLOCKS:-14400}"
MAX_DB_GB="${BITFLOW_ONCHAIN_GUARD_MAX_DB_GB:-180}"
MIN_FREE_GB="${BITFLOW_ONCHAIN_GUARD_MIN_FREE_GB:-80}"

mkdir -p "$LOCK_ROOT"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
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
  exit 0
fi

if ! [[ -x "$PSQL_BIN" && -x "$RESET_SCRIPT" && -x "$RETENTION_SCRIPT" ]]; then
  echo "onchain db guard prerequisites missing"
  exit 1
fi

if ! [[ "$MAX_DB_GB" =~ ^[0-9]+$ && "$MIN_FREE_GB" =~ ^[0-9]+$ && "$RAW_RETENTION_BLOCKS" =~ ^[0-9]+$ ]]; then
  echo "onchain db guard thresholds must be integers"
  exit 1
fi

db_size_bytes="$("$PSQL_BIN" "$BITFLOW_PG_DSN" -Atqc "SELECT pg_database_size(current_database())" 2>/dev/null || echo -1)"
if ! [[ "$db_size_bytes" =~ ^[0-9]+$ ]]; then
  exit 0
fi

free_kb="$(df -k "$ROOT_DIR" | awk 'NR==2 {print $4}')"
if ! [[ "$free_kb" =~ ^[0-9]+$ ]]; then
  echo "failed to read free disk size"
  exit 1
fi

free_bytes=$(( free_kb * 1024 ))
max_db_bytes=$(( MAX_DB_GB * 1024 * 1024 * 1024 ))
min_free_bytes=$(( MIN_FREE_GB * 1024 * 1024 * 1024 ))

if (( db_size_bytes <= max_db_bytes )) && (( free_bytes >= min_free_bytes )); then
  exit 0
fi

uid="$(id -u)"
restore_services() {
  for plist in "$CATCHUP_PLIST" "$REALTIME_PLIST"; do
    if [[ -f "$plist" ]]; then
      "$LAUNCHCTL_BIN" bootstrap "gui/$uid" "$plist" 2>/dev/null || true
    fi
  done
}
trap 'restore_services; rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

for plist in "$CATCHUP_PLIST" "$REALTIME_PLIST"; do
  if [[ -f "$plist" ]]; then
    "$LAUNCHCTL_BIN" bootout "gui/$uid" "$plist" 2>/dev/null || true
  fi
done

echo "onchain db guard triggered db_size_bytes=${db_size_bytes} free_bytes=${free_bytes}"

BITFLOW_RAW_RETENTION_BLOCKS="$RAW_RETENTION_BLOCKS" \
  "$RESET_SCRIPT"

BITFLOW_RAW_RETENTION_BLOCKS="$RAW_RETENTION_BLOCKS" \
  "$RETENTION_SCRIPT" || true
