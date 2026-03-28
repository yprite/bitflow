from __future__ import annotations

import os
import shutil
import stat
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


class PruneOnchainPostgresScriptTests(unittest.TestCase):
    def test_script_runs_vacuum_in_separate_psql_calls(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        source_script = repo_root / "scripts" / "prune-onchain-postgres.sh"

        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "scripts").mkdir()
            (root / "python").mkdir()
            (root / ".locks").mkdir()

            script_path = root / "scripts" / "prune-onchain-postgres.sh"
            shutil.copy2(source_script, script_path)
            script_path.chmod(script_path.stat().st_mode | stat.S_IXUSR)

            (root / "python" / ".env").write_text(
                textwrap.dedent(
                    """
                    BITFLOW_PG_DSN=postgresql:///bitflow_onchain
                    BITFLOW_RAW_RETENTION_BLOCKS=50
                    """
                ).strip()
                + "\n",
                encoding="utf-8",
            )

            bin_dir = root / "fake-bin"
            bin_dir.mkdir()
            psql_state = root / "psql-state"

            bitcoin_cli = bin_dir / "bitcoin-cli"
            bitcoin_cli.write_text(
                "#!/bin/sh\n"
                "printf '%s\\n' '{\"blocks\":110,\"pruned\":true,\"pruneheight\":10}'\n",
                encoding="utf-8",
            )
            bitcoin_cli.chmod(0o755)

            psql = bin_dir / "psql"
            psql.write_text(
                textwrap.dedent(
                    f"""#!/usr/bin/env python3
import os
import sys
from pathlib import Path

state_path = Path({str(psql_state)!r})
query = sys.argv[-1] if sys.argv and any(token in sys.argv[-1] for token in ("SELECT", "DELETE", "VACUUM", "WITH")) else ""
state = {{}}
if state_path.exists():
    for line in state_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        key, value = line.split("=", 1)
        state[key] = int(value)

min_height_calls = state.get("min_height_calls", 0)

if "SELECT 1" in query:
    print("1")
elif "to_regclass('public.btc_blocks')" in query:
    print("t")
elif "SELECT COALESCE(MIN(height), -1) FROM btc_blocks" in query:
    if min_height_calls == 0:
        print("1")
    else:
        print("61")
    state["min_height_calls"] = min_height_calls + 1
elif "SELECT pg_database_size(current_database())" in query:
    print("2147483648")
elif "SELECT COALESCE(COUNT(*), 0) FROM deleted_blocks" in query:
    print("42")
elif "VACUUM (ANALYZE)" in query:
    if query.count("VACUUM") > 1:
        print("ERROR:  VACUUM cannot run inside a transaction block", file=sys.stderr)
        sys.exit(1)
else:
    print(f"unexpected query: {{query}}", file=sys.stderr)
    sys.exit(1)

state_path.write_text(
    "\\n".join(f"{{key}}={{value}}" for key, value in state.items()) + ("\\n" if state else ""),
    encoding="utf-8",
)
"""
                ),
                encoding="utf-8",
            )
            psql.chmod(0o755)

            env = os.environ.copy()
            env["BITCOIN_CLI_BIN"] = str(bitcoin_cli)
            env["PSQL_BIN"] = str(psql)

            result = subprocess.run(
                [str(script_path)],
                cwd=root,
                env=env,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("retention pruned", result.stdout)


if __name__ == "__main__":
    unittest.main()
