from __future__ import annotations

import unittest
from unittest.mock import patch
from urllib import error

from bitflow_onchain.clients.bitcoin_rpc import BitcoinRPC


class BitcoinRPCTests(unittest.TestCase):
    def test_call_wraps_url_error_as_runtime_error(self) -> None:
        rpc = BitcoinRPC(
            url="http://127.0.0.1:8332",
            username="user",
            password="pass",
            timeout_seconds=3,
        )

        with patch(
            "bitflow_onchain.clients.bitcoin_rpc.request.urlopen",
            side_effect=error.URLError("connection refused"),
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "Bitcoin RPC transport error for getblockcount: connection refused",
            ):
                rpc.get_block_count()


if __name__ == "__main__":
    unittest.main()
