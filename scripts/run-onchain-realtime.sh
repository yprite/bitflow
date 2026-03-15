#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/python"
export PYTHONPATH="$ROOT_DIR/python/src"
export PYTHONUNBUFFERED=1

exec "$ROOT_DIR/python/.venv/bin/python" -m bitflow_onchain.main realtime
