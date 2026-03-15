from __future__ import annotations

from datetime import UTC, datetime

import zmq

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC
from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings
from bitflow_onchain.models import AlertEventRecord
from bitflow_onchain.pipelines.ingestion import align_store_to_chain, format_btc, ingest_block_height
from bitflow_onchain.transformers.normalize import sats_from_btc


def _handle_rawtx_event(
    rpc: BitcoinRPC,
    store: PostgresStore,
    settings: Settings,
    payload: bytes,
) -> None:
    decoded = rpc.decode_raw_transaction(payload.hex())
    total_output_sats = sum(sats_from_btc(vout["value"]) for vout in decoded.get("vout", []))
    threshold_sats = int(settings.alert_large_spend_btc * 100_000_000)
    if total_output_sats < threshold_sats:
        return

    store.insert_alert_events(
        [
            AlertEventRecord(
                detected_at=datetime.now(tz=UTC),
                alert_type="mempool_large_tx",
                severity="medium",
                title=f"Mempool large tx {format_btc(total_output_sats)} BTC",
                body=f"Unconfirmed transaction {decoded['txid']} is moving {format_btc(total_output_sats)} BTC.",
                related_txid=decoded["txid"],
                context={
                    "total_output_sats": total_output_sats,
                    "vin_count": len(decoded.get("vin", [])),
                    "vout_count": len(decoded.get("vout", [])),
                },
            )
        ]
    )


def _sync_new_blocks(rpc: BitcoinRPC, store: PostgresStore, settings: Settings) -> None:
    last_height = align_store_to_chain(rpc, store, "realtime")
    tip_height = rpc.get_block_count()
    start_height = (last_height + 1) if last_height is not None else settings.backfill_start_height

    if start_height > tip_height:
        return

    tx_cache: dict[str, dict] = {}
    for height in range(start_height, tip_height + 1):
        bundle = ingest_block_height(
            rpc=rpc,
            store=store,
            settings=settings,
            height=height,
            pipeline_name="realtime",
            tx_cache=tx_cache,
            persist_alerts=True,
        )
        print(f"confirmed block {bundle.block.height} {bundle.block.block_hash}")


def run_realtime(
    rpc: BitcoinRPC,
    store: PostgresStore,
    settings: Settings,
    rawblock_endpoint: str | None,
    rawtx_endpoint: str | None,
) -> None:
    if not rawblock_endpoint and not rawtx_endpoint:
        raise RuntimeError("Realtime pipeline requires at least one ZMQ endpoint")

    context = zmq.Context()
    socket = context.socket(zmq.SUB)

    if rawblock_endpoint:
        socket.connect(rawblock_endpoint)
        socket.setsockopt_string(zmq.SUBSCRIBE, "rawblock")

    if rawtx_endpoint:
        socket.connect(rawtx_endpoint)
        socket.setsockopt_string(zmq.SUBSCRIBE, "rawtx")

    while True:
        topic, payload, sequence = socket.recv_multipart()
        topic_name = topic.decode("utf-8")
        print(
            "received",
            topic_name,
            f"bytes={len(payload)}",
            f"sequence={int.from_bytes(sequence, 'little')}",
        )
        if topic_name == "rawblock":
            _sync_new_blocks(rpc, store, settings)
        elif topic_name == "rawtx":
            _handle_rawtx_event(rpc, store, settings, payload)
