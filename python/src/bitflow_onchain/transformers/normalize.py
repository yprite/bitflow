from __future__ import annotations

from collections.abc import Callable
from decimal import Decimal
from datetime import UTC, datetime
from typing import Any

from bitflow_onchain.models import (
    BlockBundle,
    BlockRecord,
    InputRecord,
    OutputRecord,
    OutputReference,
    SpentEdgeRecord,
    TxRecord,
)

SATOSHIS_PER_BTC = Decimal("100000000")
PrevoutResolver = Callable[[str, int], OutputReference | None]


def unix_to_datetime(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp, tz=UTC)


def sats_from_btc(value: str | int | float | Decimal) -> int:
    return int(Decimal(str(value)) * SATOSHIS_PER_BTC)


def extract_script_metadata(script_pubkey: dict[str, Any]) -> tuple[str, str | None, str | None, str | None]:
    addresses = script_pubkey.get("addresses") or []
    address = script_pubkey.get("address") or (addresses[0] if addresses else None)
    return (
        script_pubkey.get("hex", ""),
        script_pubkey.get("type"),
        address,
        script_pubkey.get("desc"),
    )


def normalize_block(block: dict[str, Any]) -> BlockRecord:
    return BlockRecord(
        height=block["height"],
        block_hash=block["hash"],
        prev_block_hash=block.get("previousblockhash"),
        block_time=unix_to_datetime(block["time"]),
        median_time=unix_to_datetime(block["mediantime"]),
        size_bytes=block["size"],
        weight=block["weight"],
        tx_count=len(block["tx"]),
    )


def normalize_transactions(block: dict[str, Any]) -> list[TxRecord]:
    tx_rows: list[TxRecord] = []
    for index, tx in enumerate(block["tx"]):
        vin = tx.get("vin", [])
        vout = tx.get("vout", [])
        is_coinbase = bool(vin and "coinbase" in vin[0])
        total_input_sats = None if is_coinbase else 0
        total_output_sats = 0

        for tx_out in vout:
            total_output_sats += sats_from_btc(tx_out["value"])

        tx_rows.append(
            TxRecord(
                txid=tx["txid"],
                block_height=block["height"],
                block_hash=block["hash"],
                tx_index=index,
                version=tx["version"],
                lock_time=tx["locktime"],
                size_bytes=tx["size"],
                vsize=tx["vsize"],
                weight=tx["weight"],
                is_coinbase=is_coinbase,
                fee_sats=None if is_coinbase else tx.get("fee"),
                total_input_sats=total_input_sats,
                total_output_sats=total_output_sats,
            )
        )

    return tx_rows


def _reference_from_output(output: OutputRecord, block_time: datetime) -> OutputReference:
    return OutputReference(
        txid=output.txid,
        vout_n=output.vout_n,
        block_height=output.block_height,
        block_time=block_time,
        value_sats=output.value_sats,
        script_pubkey=output.script_pubkey,
        script_type=output.script_type,
        address=output.address,
        descriptor=output.descriptor,
    )


def _reference_from_prevout(prev_txid: str, prev_vout_n: int, prevout: dict[str, Any]) -> OutputReference:
    script = prevout.get("scriptPubKey") or {}
    script_pubkey, script_type, address, descriptor = extract_script_metadata(script)
    block_time = unix_to_datetime(prevout["time"]) if prevout.get("time") else None
    return OutputReference(
        txid=prev_txid,
        vout_n=prev_vout_n,
        block_height=prevout.get("height"),
        block_time=block_time,
        value_sats=sats_from_btc(prevout.get("value", 0)),
        script_pubkey=script_pubkey,
        script_type=script_type,
        address=address,
        descriptor=descriptor,
    )


def _normalize_output(txid: str, block_height: int, tx_out: dict[str, Any]) -> OutputRecord:
    script_pubkey = tx_out.get("scriptPubKey") or {}
    script_hex, script_type, address, descriptor = extract_script_metadata(script_pubkey)
    return OutputRecord(
        txid=txid,
        vout_n=tx_out["n"],
        block_height=block_height,
        value_sats=sats_from_btc(tx_out["value"]),
        script_pubkey=script_hex,
        script_type=script_type,
        address=address,
        descriptor=descriptor,
        is_op_return=script_type == "nulldata",
    )


def normalize_block_bundle(
    block: dict[str, Any],
    prevout_resolver: PrevoutResolver | None = None,
) -> BlockBundle:
    block_row = normalize_block(block)
    tx_rows: list[TxRecord] = []
    input_rows: list[InputRecord] = []
    output_rows: list[OutputRecord] = []
    spent_edges: list[SpentEdgeRecord] = []
    known_prevouts: dict[tuple[str, int], OutputReference] = {}

    for index, tx in enumerate(block["tx"]):
        txid = tx["txid"]
        total_output_sats = 0

        for tx_out in tx.get("vout", []):
            output_row = _normalize_output(txid, block_row.height, tx_out)
            output_rows.append(output_row)
            total_output_sats += output_row.value_sats
            known_prevouts[(output_row.txid, output_row.vout_n)] = _reference_from_output(output_row, block_row.block_time)

        vin = tx.get("vin", [])
        is_coinbase = bool(vin and "coinbase" in vin[0])
        resolved_input_sats = 0
        all_inputs_resolved = not is_coinbase

        for vin_n, tx_in in enumerate(vin):
            if "coinbase" in tx_in:
                input_rows.append(
                    InputRecord(
                        spending_txid=txid,
                        vin_n=vin_n,
                        block_height=block_row.height,
                        prev_txid=None,
                        prev_vout_n=None,
                        sequence=tx_in["sequence"],
                        coinbase_data=tx_in.get("coinbase"),
                    )
                )
                continue

            prev_txid = tx_in["txid"]
            prev_vout_n = tx_in["vout"]
            prevout_ref = None

            if tx_in.get("prevout"):
                prevout_ref = _reference_from_prevout(prev_txid, prev_vout_n, tx_in["prevout"])
            elif (prev_txid, prev_vout_n) in known_prevouts:
                prevout_ref = known_prevouts[(prev_txid, prev_vout_n)]
            elif prevout_resolver is not None:
                prevout_ref = prevout_resolver(prev_txid, prev_vout_n)

            input_rows.append(
                InputRecord(
                    spending_txid=txid,
                    vin_n=vin_n,
                    block_height=block_row.height,
                    prev_txid=prev_txid,
                    prev_vout_n=prev_vout_n,
                    sequence=tx_in["sequence"],
                    prev_value_sats=prevout_ref.value_sats if prevout_ref else None,
                    prev_script_pubkey=prevout_ref.script_pubkey if prevout_ref else None,
                )
            )

            if prevout_ref is None:
                all_inputs_resolved = False
                continue

            resolved_input_sats += prevout_ref.value_sats
            age_seconds = None
            if prevout_ref.block_time is not None:
                age_seconds = int((block_row.block_time - prevout_ref.block_time).total_seconds())

            spent_edges.append(
                SpentEdgeRecord(
                    spending_txid=txid,
                    vin_n=vin_n,
                    prev_txid=prev_txid,
                    prev_vout_n=prev_vout_n,
                    spending_block_height=block_row.height,
                    spending_time=block_row.block_time,
                    created_block_height=prevout_ref.block_height,
                    created_time=prevout_ref.block_time,
                    value_sats=prevout_ref.value_sats,
                    age_seconds=age_seconds,
                )
            )

        tx_rows.append(
            TxRecord(
                txid=txid,
                block_height=block_row.height,
                block_hash=block_row.block_hash,
                tx_index=index,
                version=tx["version"],
                lock_time=tx["locktime"],
                size_bytes=tx["size"],
                vsize=tx["vsize"],
                weight=tx["weight"],
                is_coinbase=is_coinbase,
                fee_sats=None if is_coinbase or not all_inputs_resolved else resolved_input_sats - total_output_sats,
                total_input_sats=None if is_coinbase or not all_inputs_resolved else resolved_input_sats,
                total_output_sats=total_output_sats,
            )
        )

    return BlockBundle(
        block=block_row,
        txs=tx_rows,
        inputs=input_rows,
        outputs=output_rows,
        spent_edges=spent_edges,
    )
