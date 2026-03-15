from __future__ import annotations

import base64
import json
from typing import Any
from urllib import request


class BitcoinRPC:
    def __init__(self, url: str, username: str, password: str, timeout_seconds: int = 30) -> None:
        self.url = url
        self.timeout_seconds = timeout_seconds
        token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
        self.headers = {
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
        }

    def call(self, method: str, *params: Any) -> Any:
        payload = json.dumps(
            {
                "jsonrpc": "2.0",
                "id": method,
                "method": method,
                "params": list(params),
            }
        ).encode("utf-8")
        req = request.Request(self.url, data=payload, headers=self.headers, method="POST")
        with request.urlopen(req, timeout=self.timeout_seconds) as response:
            body = json.loads(response.read().decode("utf-8"))
        error = body.get("error")
        if error is not None:
            raise RuntimeError(f"Bitcoin RPC error for {method}: {error}")
        if "result" not in body:
            raise RuntimeError(f"Bitcoin RPC malformed response for {method}: {body}")
        return body["result"]

    def get_block_hash(self, height: int) -> str:
        return self.call("getblockhash", height)

    def get_block(self, block_hash: str, verbosity: int = 3) -> dict[str, Any]:
        return self.call("getblock", block_hash, verbosity)

    def get_raw_transaction(self, txid: str, verbose: bool = True, block_hash: str | None = None) -> dict[str, Any]:
        params: list[Any] = [txid, verbose]
        if block_hash:
            params.append(block_hash)
        return self.call("getrawtransaction", *params)

    def get_blockchain_info(self) -> dict[str, Any]:
        return self.call("getblockchaininfo")

    def get_block_count(self) -> int:
        return self.call("getblockcount")

    def get_best_block_hash(self) -> str:
        return self.call("getbestblockhash")

    def get_block_header(self, block_hash: str) -> dict[str, Any]:
        return self.call("getblockheader", block_hash, True)

    def decode_raw_transaction(self, raw_hex: str) -> dict[str, Any]:
        return self.call("decoderawtransaction", raw_hex)
