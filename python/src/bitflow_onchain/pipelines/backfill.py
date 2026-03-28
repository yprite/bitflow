from __future__ import annotations

from datetime import UTC, datetime

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC
from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings
from bitflow_onchain.pipelines.ingestion import ingest_block_height

MAX_BACKFILL_FLUSH_BLOCKS = 8


def run_backfill(
    rpc: BitcoinRPC,
    store: PostgresStore,
    settings: Settings,
    start_height: int,
    end_height: int,
    batch_size: int,
    pipeline_name: str = "backfill",
) -> None:
    tx_cache: dict[str, dict] = {}
    pending_bundles = []
    batch_start = start_height
    flush_every = max(1, min(batch_size, MAX_BACKFILL_FLUSH_BLOCKS))
    for height in range(start_height, end_height + 1):
        bundle = ingest_block_height(
            rpc=rpc,
            store=store,
            settings=settings,
            height=height,
            pipeline_name=pipeline_name,
            tx_cache=tx_cache,
            persist_alerts=False,
            persist_bundle=False,
        )
        pending_bundles.append(bundle)

        if len(pending_bundles) >= flush_every or height == end_height:
            store.upsert_block_bundles(pending_bundles, conflict_mode="ignore")
            last_bundle = pending_bundles[-1]
            store.update_sync_state(
                pipeline_name=pipeline_name,
                last_height=last_bundle.block.height,
                last_block_hash=last_bundle.block.block_hash,
                cursor={
                    "phase": "normalized",
                    "updated_at": datetime.now(tz=UTC).isoformat(),
                },
            )
            print(f"backfilled blocks {batch_start}-{height} (tip hash {bundle.block.block_hash})")
            batch_start = height + 1
            pending_bundles = []
