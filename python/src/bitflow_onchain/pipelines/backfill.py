from __future__ import annotations

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC
from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings
from bitflow_onchain.pipelines.ingestion import ingest_block_height


def run_backfill(
    rpc: BitcoinRPC,
    store: PostgresStore,
    settings: Settings,
    start_height: int,
    end_height: int,
    batch_size: int,
) -> None:
    tx_cache: dict[str, dict] = {}
    batch_start = start_height
    for height in range(start_height, end_height + 1):
        bundle = ingest_block_height(
            rpc=rpc,
            store=store,
            settings=settings,
            height=height,
            pipeline_name="backfill",
            tx_cache=tx_cache,
            persist_alerts=False,
        )
        if (height - batch_start + 1) >= batch_size or height == end_height:
            print(f"backfilled blocks {batch_start}-{height} (tip hash {bundle.block.block_hash})")
            batch_start = height + 1
