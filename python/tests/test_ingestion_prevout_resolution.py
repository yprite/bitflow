from __future__ import annotations

import unittest

from bitflow_onchain.models import OutputReference
from bitflow_onchain.pipelines.ingestion import build_prevout_resolver


class _StoreStub:
    def __init__(self, live_reference: OutputReference | None, snapshot_reference: OutputReference | None) -> None:
        self.live_reference = live_reference
        self.snapshot_reference = snapshot_reference
        self.output_calls: list[tuple[str, int]] = []
        self.snapshot_calls: list[tuple[str, int]] = []

    def fetch_output_reference(self, txid: str, vout_n: int) -> OutputReference | None:
        self.output_calls.append((txid, vout_n))
        return self.live_reference

    def fetch_prevout_snapshot_reference(self, txid: str, vout_n: int) -> OutputReference | None:
        self.snapshot_calls.append((txid, vout_n))
        return self.snapshot_reference


class _RPCStub:
    def __init__(self) -> None:
        self.calls: list[tuple[str, bool, str | None]] = []

    def get_raw_transaction(self, txid: str, verbose: bool = True, block_hash: str | None = None) -> dict:
        self.calls.append((txid, verbose, block_hash))
        raise AssertionError("RPC fallback should not be used when snapshot data exists")


class IngestionPrevoutResolutionTests(unittest.TestCase):
    def test_prevout_resolver_uses_snapshot_when_live_output_is_missing(self) -> None:
        snapshot_reference = OutputReference(
            txid="prevtx",
            vout_n=1,
            block_height=900000,
            block_time=None,
            value_sats=123456,
            script_pubkey="0014deadbeef",
            script_type="witness_v0_keyhash",
            address="bc1qexample",
            descriptor=None,
        )
        store = _StoreStub(live_reference=None, snapshot_reference=snapshot_reference)
        rpc = _RPCStub()

        resolver = build_prevout_resolver(rpc=rpc, store=store, tx_cache={})

        resolved = resolver("prevtx", 1)

        self.assertEqual(resolved, snapshot_reference)
        self.assertEqual(store.output_calls, [("prevtx", 1)])
        self.assertEqual(store.snapshot_calls, [("prevtx", 1)])
        self.assertEqual(rpc.calls, [])


if __name__ == "__main__":
    unittest.main()
