#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  source "$ROOT_DIR/.env.local"
  set +a
fi

if [[ -f "$ROOT_DIR/python/.env" ]]; then
  set -a
  source "$ROOT_DIR/python/.env"
  set +a
fi

exec node "$ROOT_DIR/scripts/ingest-news-candidates.mjs" "$@"
