from __future__ import annotations

import argparse
from datetime import date

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC
from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings
from bitflow_onchain.pipelines.backfill import run_backfill
from bitflow_onchain.pipelines.metrics import run_metrics
from bitflow_onchain.pipelines.realtime import run_realtime


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="BitFlow bitcoin on-chain worker")
    subparsers = parser.add_subparsers(dest="command", required=True)

    backfill = subparsers.add_parser("backfill")
    backfill.add_argument("--start-height", type=int)
    backfill.add_argument("--end-height", type=int)
    backfill.add_argument("--batch-size", type=int)

    metrics = subparsers.add_parser("metrics")
    metrics.add_argument("--date", required=True, help="UTC date in YYYY-MM-DD")

    subparsers.add_parser("realtime")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    settings = Settings.from_env()
    store = PostgresStore(settings.postgres_dsn)

    if args.command == "backfill":
        rpc = BitcoinRPC(
            url=settings.bitcoin_rpc_url,
            username=settings.bitcoin_rpc_user,
            password=settings.bitcoin_rpc_password,
            timeout_seconds=settings.bitcoin_rpc_timeout_seconds,
        )
        end_height = args.end_height if args.end_height is not None else rpc.get_block_count()
        run_backfill(
            rpc=rpc,
            store=store,
            settings=settings,
            start_height=args.start_height if args.start_height is not None else settings.backfill_start_height,
            end_height=end_height,
            batch_size=args.batch_size if args.batch_size is not None else settings.backfill_batch_size,
        )
        return

    if args.command == "metrics":
        run_metrics(store=store, settings=settings, target_day=date.fromisoformat(args.date))
        return

    if args.command == "realtime":
        rpc = BitcoinRPC(
            url=settings.bitcoin_rpc_url,
            username=settings.bitcoin_rpc_user,
            password=settings.bitcoin_rpc_password,
            timeout_seconds=settings.bitcoin_rpc_timeout_seconds,
        )
        run_realtime(
            rpc=rpc,
            store=store,
            settings=settings,
            rawblock_endpoint=settings.bitcoin_zmq_rawblock,
            rawtx_endpoint=settings.bitcoin_zmq_rawtx,
        )
        return

    raise RuntimeError(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
