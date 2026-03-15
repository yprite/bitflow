from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any


@dataclass(slots=True)
class BlockRecord:
    height: int
    block_hash: str
    prev_block_hash: str | None
    block_time: datetime
    median_time: datetime
    size_bytes: int
    weight: int
    tx_count: int


@dataclass(slots=True)
class TxRecord:
    txid: str
    block_height: int
    block_hash: str
    tx_index: int
    version: int
    lock_time: int
    size_bytes: int
    vsize: int
    weight: int
    is_coinbase: bool
    fee_sats: int | None
    total_input_sats: int | None
    total_output_sats: int


@dataclass(slots=True)
class InputRecord:
    spending_txid: str
    vin_n: int
    block_height: int
    prev_txid: str | None
    prev_vout_n: int | None
    sequence: int
    coinbase_data: str | None = None
    prev_value_sats: int | None = None
    prev_script_pubkey: str | None = None


@dataclass(slots=True)
class OutputRecord:
    txid: str
    vout_n: int
    block_height: int
    value_sats: int
    script_pubkey: str
    script_type: str | None
    address: str | None
    descriptor: str | None = None
    is_op_return: bool = False


@dataclass(slots=True)
class SpentEdgeRecord:
    spending_txid: str
    vin_n: int
    prev_txid: str
    prev_vout_n: int
    spending_block_height: int
    spending_time: datetime
    created_block_height: int | None = None
    created_time: datetime | None = None
    value_sats: int | None = None
    age_seconds: int | None = None


@dataclass(slots=True)
class DailyMetricRow:
    day: date
    metric_name: str
    metric_value: float
    unit: str
    dimension_key: str = "all"
    dimensions: dict[str, str] = field(default_factory=dict)


@dataclass(slots=True)
class OutputReference:
    txid: str
    vout_n: int
    block_height: int | None
    block_time: datetime | None
    value_sats: int
    script_pubkey: str
    script_type: str | None
    address: str | None
    descriptor: str | None = None


@dataclass(slots=True)
class BlockBundle:
    block: BlockRecord
    txs: list[TxRecord]
    inputs: list[InputRecord]
    outputs: list[OutputRecord]
    spent_edges: list[SpentEdgeRecord]


@dataclass(slots=True)
class EntityFlowRow:
    day: date
    entity_slug: str
    network: str
    received_sats: int
    sent_sats: int
    netflow_sats: int
    tx_count: int


@dataclass(slots=True)
class AlertEventRecord:
    detected_at: datetime
    alert_type: str
    severity: str
    title: str
    body: str
    related_txid: str | None = None
    related_entity_slug: str | None = None
    context: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class SyncState:
    pipeline_name: str
    last_height: int
    last_block_hash: str
    cursor: dict[str, Any] = field(default_factory=dict)
