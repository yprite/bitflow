from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path


def load_dotenv() -> None:
    candidates = [
        Path.cwd() / ".env",
        Path.cwd() / "python" / ".env",
        Path(__file__).resolve().parents[2] / ".env",
    ]

    seen: set[Path] = set()
    for candidate in candidates:
        if candidate in seen or not candidate.exists():
            continue
        seen.add(candidate)
        for raw_line in candidate.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _get_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    bitcoin_rpc_url: str
    bitcoin_rpc_user: str
    bitcoin_rpc_password: str
    bitcoin_rpc_timeout_seconds: int
    bitcoin_zmq_rawblock: str | None
    bitcoin_zmq_rawtx: str | None
    postgres_dsn: str
    network: str
    backfill_start_height: int
    backfill_batch_size: int
    alert_large_spend_btc: float
    alert_dormant_days: int
    alert_dormant_min_btc: float

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv()
        return cls(
            bitcoin_rpc_url=_get_env("BITCOIN_RPC_URL"),
            bitcoin_rpc_user=_get_env("BITCOIN_RPC_USER"),
            bitcoin_rpc_password=_get_env("BITCOIN_RPC_PASSWORD"),
            bitcoin_rpc_timeout_seconds=int(os.getenv("BITCOIN_RPC_TIMEOUT_SECONDS", "30")),
            bitcoin_zmq_rawblock=os.getenv("BITCOIN_ZMQ_RAWBLOCK"),
            bitcoin_zmq_rawtx=os.getenv("BITCOIN_ZMQ_RAWTX"),
            postgres_dsn=_get_env("BITFLOW_PG_DSN"),
            network=os.getenv("BITFLOW_NETWORK", "mainnet"),
            backfill_start_height=int(os.getenv("BITFLOW_BACKFILL_START_HEIGHT", "0")),
            backfill_batch_size=int(os.getenv("BITFLOW_BACKFILL_BATCH_SIZE", "200")),
            alert_large_spend_btc=float(os.getenv("BITFLOW_ALERT_LARGE_SPEND_BTC", "100")),
            alert_dormant_days=int(os.getenv("BITFLOW_ALERT_DORMANT_DAYS", "180")),
            alert_dormant_min_btc=float(os.getenv("BITFLOW_ALERT_DORMANT_MIN_BTC", "50")),
        )
