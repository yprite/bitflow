from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC
from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings
from bitflow_onchain.models import AlertEventRecord, BlockBundle, OutputReference
from bitflow_onchain.transformers.normalize import normalize_block_bundle, sats_from_btc, unix_to_datetime


def format_btc(value_sats: int) -> str:
    return f"{value_sats / 100_000_000:.8f}".rstrip("0").rstrip(".")


def _reference_from_verbose_tx(
    rpc: BitcoinRPC,
    prev_txid: str,
    prev_vout_n: int,
    tx_cache: dict[str, dict[str, Any]],
) -> OutputReference | None:
    tx = tx_cache.get(prev_txid)
    if tx is None:
        try:
            tx = rpc.get_raw_transaction(prev_txid, True)
        except RuntimeError:
            return None
        tx_cache[prev_txid] = tx

    outputs = tx.get("vout", [])
    if prev_vout_n >= len(outputs):
        return None

    tx_out = outputs[prev_vout_n]
    script_pubkey = tx_out.get("scriptPubKey") or {}
    addresses = script_pubkey.get("addresses") or []
    address = script_pubkey.get("address") or (addresses[0] if addresses else None)
    block_height = None
    block_time = unix_to_datetime(tx["blocktime"]) if tx.get("blocktime") else None

    if tx.get("blockhash"):
        try:
            header = rpc.get_block_header(tx["blockhash"])
        except RuntimeError:
            header = None
        if header is not None:
            block_height = header.get("height")

    return OutputReference(
        txid=prev_txid,
        vout_n=prev_vout_n,
        block_height=block_height,
        block_time=block_time,
        value_sats=sats_from_btc(tx_out["value"]),
        script_pubkey=script_pubkey.get("hex", ""),
        script_type=script_pubkey.get("type"),
        address=address,
        descriptor=script_pubkey.get("desc"),
    )


def build_prevout_resolver(
    rpc: BitcoinRPC,
    store: PostgresStore,
    tx_cache: dict[str, dict[str, Any]],
):
    resolved_cache: dict[tuple[str, int], OutputReference | None] = {}

    def resolve(prev_txid: str, prev_vout_n: int) -> OutputReference | None:
        key = (prev_txid, prev_vout_n)
        if key in resolved_cache:
            return resolved_cache[key]
        stored = store.fetch_output_reference(prev_txid, prev_vout_n)
        if stored is not None:
            resolved_cache[key] = stored
            return stored
        snapshot = store.fetch_prevout_snapshot_reference(prev_txid, prev_vout_n)
        if snapshot is not None:
            resolved_cache[key] = snapshot
            return snapshot
        resolved_cache[key] = _reference_from_verbose_tx(rpc, prev_txid, prev_vout_n, tx_cache)
        return resolved_cache[key]

    return resolve


def build_block_alerts(bundle: BlockBundle, settings: Settings) -> list[AlertEventRecord]:
    alerts = [
        AlertEventRecord(
            detected_at=bundle.block.block_time,
            alert_type="new_block",
            severity="info",
            title=f"New block #{bundle.block.height}",
            body=f"Block {bundle.block.block_hash} confirmed with {bundle.block.tx_count} transactions.",
            context={
                "height": bundle.block.height,
                "block_hash": bundle.block.block_hash,
                "tx_count": bundle.block.tx_count,
            },
        )
    ]

    large_spend_sats = int(settings.alert_large_spend_btc * 100_000_000)
    dormant_min_sats = int(settings.alert_dormant_min_btc * 100_000_000)
    dormant_min_age = settings.alert_dormant_days * 86400

    for tx in bundle.txs:
        if tx.is_coinbase or tx.total_output_sats < large_spend_sats:
            continue
        alerts.append(
            AlertEventRecord(
                detected_at=bundle.block.block_time,
                alert_type="large_confirmed_spend",
                severity="high",
                title=f"Large spend {format_btc(tx.total_output_sats)} BTC",
                body=f"Confirmed transaction {tx.txid} moved {format_btc(tx.total_output_sats)} BTC in block {bundle.block.height}.",
                related_txid=tx.txid,
                context={
                    "height": bundle.block.height,
                    "total_output_sats": tx.total_output_sats,
                    "fee_sats": tx.fee_sats,
                },
            )
        )

    for edge in bundle.spent_edges:
        if edge.value_sats is None or edge.age_seconds is None:
            continue
        if edge.value_sats < dormant_min_sats or edge.age_seconds < dormant_min_age:
            continue
        alerts.append(
            AlertEventRecord(
                detected_at=edge.spending_time,
                alert_type="dormant_reactivation",
                severity="high",
                title=f"Dormant {format_btc(edge.value_sats)} BTC moved",
                body=(
                    f"Spent output {edge.prev_txid}:{edge.prev_vout_n} aged "
                    f"{edge.age_seconds // 86400} days in tx {edge.spending_txid}."
                ),
                related_txid=edge.spending_txid,
                context={
                    "height": edge.spending_block_height,
                    "value_sats": edge.value_sats,
                    "age_seconds": edge.age_seconds,
                    "prev_txid": edge.prev_txid,
                    "prev_vout_n": edge.prev_vout_n,
                },
            )
        )

    return alerts


def ingest_block_height(
    rpc: BitcoinRPC,
    store: PostgresStore,
    settings: Settings,
    height: int,
    pipeline_name: str,
    tx_cache: dict[str, dict[str, Any]] | None = None,
    persist_alerts: bool = False,
    persist_bundle: bool = True,
) -> BlockBundle:
    if tx_cache is None:
        tx_cache = {}
    block_hash = rpc.get_block_hash(height)
    block = rpc.get_block(block_hash, 3)
    resolver = build_prevout_resolver(rpc, store, tx_cache)
    bundle = normalize_block_bundle(block, resolver)
    if persist_bundle:
        store.upsert_block_bundle(bundle)
        store.update_sync_state(
            pipeline_name=pipeline_name,
            last_height=height,
            last_block_hash=bundle.block.block_hash,
            cursor={
                "phase": "normalized",
                "updated_at": datetime.now(tz=UTC).isoformat(),
            },
        )
    if persist_alerts:
        store.insert_alert_events(build_block_alerts(bundle, settings))
    return bundle


def align_store_to_chain(
    rpc: BitcoinRPC,
    store: PostgresStore,
    pipeline_name: str,
) -> int | None:
    state = store.get_sync_state(pipeline_name)
    if state is None:
        return store.fetch_max_block_height()

    height = state.last_height
    while height >= 0:
        db_hash = store.fetch_block_hash_at_height(height)
        if db_hash is None:
            height -= 1
            continue
        chain_hash = rpc.get_block_hash(height)
        if chain_hash == db_hash:
            if height != state.last_height:
                store.update_sync_state(pipeline_name, height, chain_hash, {"phase": "reorg_recovered"})
            return height
        store.delete_from_height(height)
        height -= 1

    return None
