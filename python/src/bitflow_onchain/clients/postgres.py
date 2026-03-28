from __future__ import annotations

from collections.abc import Iterable
from contextlib import contextmanager
from dataclasses import asdict
from datetime import date
from typing import Any

import psycopg
from psycopg.rows import dict_row

from bitflow_onchain.models import (
    AlertEventRecord,
    BlockBundle,
    DailyMetricRow,
    EntityFlowRow,
    OutputReference,
    SpentEdgeRecord,
    SyncState,
)

HALVING_INTERVAL = 210_000
INITIAL_SUBSIDY_SATS = 50 * 100_000_000


def issued_supply_sats_through_height(height: int | None) -> int:
    if height is None or height < 0:
        return 0

    remaining_blocks = height + 1
    subsidy_sats = INITIAL_SUBSIDY_SATS
    total_sats = 0

    while remaining_blocks > 0 and subsidy_sats > 0:
        blocks_in_epoch = min(remaining_blocks, HALVING_INTERVAL)
        total_sats += blocks_in_epoch * subsidy_sats
        remaining_blocks -= blocks_in_epoch
        subsidy_sats //= 2

    return total_sats


class PostgresStore:
    def __init__(self, dsn: str) -> None:
        self.dsn = dsn

    @contextmanager
    def connect(self):
        with psycopg.connect(self.dsn) as conn:
            yield conn

    def _executemany(self, cur: Any, sql: str, rows: list[dict[str, Any]]) -> None:
        if rows:
            cur.executemany(sql, rows)

    def _execute_values_batch(
        self,
        cur: Any,
        table: str,
        columns: list[str],
        rows: list[dict[str, Any]],
        *,
        conflict_clause: str | None = None,
        page_size: int | None = None,
    ) -> None:
        if not rows:
            return

        column_list = ", ".join(columns)
        row_placeholder = f"({', '.join(['%s'] * len(columns))})"
        effective_page_size = page_size or max(1, 60000 // len(columns))

        for start in range(0, len(rows), effective_page_size):
            chunk = rows[start : start + effective_page_size]
            values_sql = ", ".join([row_placeholder] * len(chunk))
            params: list[Any] = []
            for row in chunk:
                for column in columns:
                    params.append(row.get(column))

            sql = f"INSERT INTO {table} ({column_list}) VALUES {values_sql}"
            if conflict_clause:
                sql = f"{sql} {conflict_clause}"
            cur.execute(sql, params)

    def _upsert_block_bundle_payload(
        self,
        cur: Any,
        *,
        block_rows: list[dict[str, Any]],
        tx_rows: list[dict[str, Any]],
        output_rows: list[dict[str, Any]],
        input_rows: list[dict[str, Any]],
        spent_edge_rows: list[dict[str, Any]],
        conflict_mode: str = "update",
    ) -> None:
        if conflict_mode not in {"update", "ignore"}:
            raise ValueError(f"Unsupported conflict_mode: {conflict_mode}")

        block_conflict_clause = """
            ON CONFLICT (height) DO UPDATE SET
              block_hash = EXCLUDED.block_hash,
              prev_block_hash = EXCLUDED.prev_block_hash,
              block_time = EXCLUDED.block_time,
              median_time = EXCLUDED.median_time,
              size_bytes = EXCLUDED.size_bytes,
              weight = EXCLUDED.weight,
              tx_count = EXCLUDED.tx_count,
              updated_at = NOW()
            """
        tx_conflict_clause = """
            ON CONFLICT (txid) DO UPDATE SET
              block_height = EXCLUDED.block_height,
              block_hash = EXCLUDED.block_hash,
              tx_index = EXCLUDED.tx_index,
              version = EXCLUDED.version,
              lock_time = EXCLUDED.lock_time,
              size_bytes = EXCLUDED.size_bytes,
              vsize = EXCLUDED.vsize,
              weight = EXCLUDED.weight,
              is_coinbase = EXCLUDED.is_coinbase,
              fee_sats = EXCLUDED.fee_sats,
              total_input_sats = EXCLUDED.total_input_sats,
              total_output_sats = EXCLUDED.total_output_sats,
              updated_at = NOW()
            """
        output_conflict_clause = """
            ON CONFLICT (txid, vout_n) DO UPDATE SET
              block_height = EXCLUDED.block_height,
              value_sats = EXCLUDED.value_sats,
              script_pubkey = EXCLUDED.script_pubkey,
              script_type = EXCLUDED.script_type,
              address = EXCLUDED.address,
              descriptor = EXCLUDED.descriptor,
              is_op_return = EXCLUDED.is_op_return,
              updated_at = NOW()
            """
        input_conflict_clause = """
            ON CONFLICT (spending_txid, vin_n) DO UPDATE SET
              block_height = EXCLUDED.block_height,
              prev_txid = EXCLUDED.prev_txid,
              prev_vout_n = EXCLUDED.prev_vout_n,
              sequence = EXCLUDED.sequence,
              coinbase_data = EXCLUDED.coinbase_data,
              prev_value_sats = EXCLUDED.prev_value_sats,
              prev_script_pubkey = EXCLUDED.prev_script_pubkey,
              updated_at = NOW()
            """
        spent_edge_conflict_clause = """
            ON CONFLICT (spending_txid, vin_n) DO UPDATE SET
              prev_txid = EXCLUDED.prev_txid,
              prev_vout_n = EXCLUDED.prev_vout_n,
              spending_block_height = EXCLUDED.spending_block_height,
              spending_time = EXCLUDED.spending_time,
              created_block_height = EXCLUDED.created_block_height,
              created_time = EXCLUDED.created_time,
              value_sats = EXCLUDED.value_sats,
              age_seconds = EXCLUDED.age_seconds,
              prev_script_pubkey = EXCLUDED.prev_script_pubkey,
              prev_script_type = EXCLUDED.prev_script_type,
              prev_address = EXCLUDED.prev_address,
              prev_descriptor = EXCLUDED.prev_descriptor,
              updated_at = NOW()
            """

        if conflict_mode == "ignore":
            block_conflict_clause = "ON CONFLICT (height) DO NOTHING"
            tx_conflict_clause = "ON CONFLICT (txid) DO NOTHING"
            output_conflict_clause = "ON CONFLICT (txid, vout_n) DO NOTHING"
            input_conflict_clause = "ON CONFLICT (spending_txid, vin_n) DO NOTHING"
            spent_edge_conflict_clause = "ON CONFLICT (spending_txid, vin_n) DO NOTHING"

        self._execute_values_batch(
            cur,
            "btc_blocks",
            [
                "height",
                "block_hash",
                "prev_block_hash",
                "block_time",
                "median_time",
                "size_bytes",
                "weight",
                "tx_count",
            ],
            block_rows,
            conflict_clause=block_conflict_clause,
        )

        self._execute_values_batch(
            cur,
            "btc_txs",
            [
                "txid",
                "block_height",
                "block_hash",
                "tx_index",
                "version",
                "lock_time",
                "size_bytes",
                "vsize",
                "weight",
                "is_coinbase",
                "fee_sats",
                "total_input_sats",
                "total_output_sats",
            ],
            tx_rows,
            conflict_clause=tx_conflict_clause,
        )

        self._execute_values_batch(
            cur,
            "btc_outputs",
            [
                "txid",
                "vout_n",
                "block_height",
                "value_sats",
                "script_pubkey",
                "script_type",
                "address",
                "descriptor",
                "is_op_return",
            ],
            output_rows,
            conflict_clause=output_conflict_clause,
        )

        self._execute_values_batch(
            cur,
            "btc_inputs",
            [
                "spending_txid",
                "vin_n",
                "block_height",
                "prev_txid",
                "prev_vout_n",
                "sequence",
                "coinbase_data",
                "prev_value_sats",
                "prev_script_pubkey",
            ],
            input_rows,
            conflict_clause=input_conflict_clause,
        )

        self._execute_values_batch(
            cur,
            "btc_spent_edges",
            [
                "spending_txid",
                "vin_n",
                "prev_txid",
                "prev_vout_n",
                "spending_block_height",
                "spending_time",
                "created_block_height",
                "created_time",
                "value_sats",
                "age_seconds",
                "prev_script_pubkey",
                "prev_script_type",
                "prev_address",
                "prev_descriptor",
            ],
            spent_edge_rows,
            conflict_clause=spent_edge_conflict_clause,
        )

    def upsert_block_bundle(self, bundle: BlockBundle) -> None:
        with self.connect() as conn, conn.cursor() as cur:
            self._upsert_block_bundle_payload(
                cur,
                block_rows=[asdict(bundle.block)],
                tx_rows=[asdict(row) for row in bundle.txs],
                output_rows=[asdict(row) for row in bundle.outputs],
                input_rows=[asdict(row) for row in bundle.inputs],
                spent_edge_rows=[asdict(row) for row in bundle.spent_edges],
                conflict_mode="update",
            )

    def upsert_block_bundles(self, bundles: Iterable[BlockBundle], *, conflict_mode: str = "update") -> None:
        materialized = list(bundles)
        if not materialized:
            return

        block_rows = [asdict(bundle.block) for bundle in materialized]
        tx_rows = [asdict(row) for bundle in materialized for row in bundle.txs]
        output_rows = [asdict(row) for bundle in materialized for row in bundle.outputs]
        input_rows = [asdict(row) for bundle in materialized for row in bundle.inputs]
        spent_edge_rows = [asdict(row) for bundle in materialized for row in bundle.spent_edges]

        with self.connect() as conn, conn.cursor() as cur:
            self._upsert_block_bundle_payload(
                cur,
                block_rows=block_rows,
                tx_rows=tx_rows,
                output_rows=output_rows,
                input_rows=input_rows,
                spent_edge_rows=spent_edge_rows,
                conflict_mode=conflict_mode,
            )

    def replace_daily_metrics(self, day: date, rows: Iterable[DailyMetricRow]) -> None:
        payload = [
            {
                **asdict(row),
                "dimensions": psycopg.types.json.Jsonb(row.dimensions),
            }
            for row in rows
        ]
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM btc_daily_metrics WHERE day = %s", (day,))
            self._executemany(
                cur,
                """
                INSERT INTO btc_daily_metrics (
                  day,
                  metric_name,
                  metric_value,
                  unit,
                  dimension_key,
                  dimensions
                )
                VALUES (
                  %(day)s,
                  %(metric_name)s,
                  %(metric_value)s,
                  %(unit)s,
                  %(dimension_key)s,
                  %(dimensions)s
                )
                """,
                payload,
            )

    def replace_entity_flow_daily(self, day: date, rows: Iterable[EntityFlowRow]) -> None:
        payload = [asdict(row) for row in rows]
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM btc_entity_flow_daily WHERE day = %s", (day,))
            self._executemany(
                cur,
                """
                INSERT INTO btc_entity_flow_daily (
                  day,
                  entity_slug,
                  network,
                  received_sats,
                  sent_sats,
                  netflow_sats,
                  tx_count
                )
                VALUES (
                  %(day)s,
                  %(entity_slug)s,
                  %(network)s,
                  %(received_sats)s,
                  %(sent_sats)s,
                  %(netflow_sats)s,
                  %(tx_count)s
                )
                """,
                payload,
            )

    def insert_alert_events(self, rows: Iterable[AlertEventRecord]) -> None:
        payload = [
            {
                **asdict(row),
                "context": psycopg.types.json.Jsonb(row.context),
            }
            for row in rows
        ]
        if not payload:
            return
        with self.connect() as conn, conn.cursor() as cur:
            self._executemany(
                cur,
                """
                INSERT INTO btc_alert_events (
                  detected_at,
                  alert_type,
                  severity,
                  title,
                  body,
                  related_txid,
                  related_entity_slug,
                  context
                )
                VALUES (
                  %(detected_at)s,
                  %(alert_type)s,
                  %(severity)s,
                  %(title)s,
                  %(body)s,
                  %(related_txid)s,
                  %(related_entity_slug)s,
                  %(context)s
                )
                ON CONFLICT (alert_type, detected_at, related_txid, related_entity_slug) DO NOTHING
                """,
                payload,
            )

    def update_sync_state(
        self,
        pipeline_name: str,
        last_height: int,
        last_block_hash: str,
        cursor: dict[str, Any] | None = None,
    ) -> None:
        params = {
            "pipeline_name": pipeline_name,
            "last_height": last_height,
            "last_block_hash": last_block_hash,
            "cursor": psycopg.types.json.Jsonb(cursor or {}),
        }
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO btc_sync_state (
                  pipeline_name,
                  last_height,
                  last_block_hash,
                  cursor
                )
                VALUES (
                  %(pipeline_name)s,
                  %(last_height)s,
                  %(last_block_hash)s,
                  %(cursor)s
                )
                ON CONFLICT (pipeline_name) DO UPDATE SET
                  last_height = EXCLUDED.last_height,
                  last_block_hash = EXCLUDED.last_block_hash,
                  cursor = EXCLUDED.cursor,
                  updated_at = NOW()
                """,
                params,
            )

    def get_sync_state(self, pipeline_name: str) -> SyncState | None:
        with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT pipeline_name, last_height, last_block_hash, cursor
                FROM btc_sync_state
                WHERE pipeline_name = %s
                """,
                (pipeline_name,),
            )
            row = cur.fetchone()
        if row is None:
            return None
        return SyncState(
            pipeline_name=row["pipeline_name"],
            last_height=row["last_height"],
            last_block_hash=row["last_block_hash"],
            cursor=row["cursor"] or {},
        )

    def fetch_max_block_height(self) -> int | None:
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT MAX(height) FROM btc_blocks")
            row = cur.fetchone()
        value = row[0] if row else None
        return int(value) if value is not None else None

    def fetch_block_hash_at_height(self, height: int) -> str | None:
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT block_hash FROM btc_blocks WHERE height = %s", (height,))
            row = cur.fetchone()
        return row[0] if row else None

    def delete_from_height(self, from_height: int) -> None:
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM btc_blocks WHERE height >= %s", (from_height,))

    def fetch_output_reference(self, txid: str, vout_n: int) -> OutputReference | None:
        with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  o.txid,
                  o.vout_n,
                  o.block_height,
                  b.block_time,
                  o.value_sats,
                  o.script_pubkey,
                  o.script_type,
                  o.address,
                  o.descriptor
                FROM btc_outputs o
                JOIN btc_blocks b ON b.height = o.block_height
                WHERE o.txid = %s AND o.vout_n = %s
                """,
                (txid, vout_n),
            )
            row = cur.fetchone()
        if row is None:
            return None
        return OutputReference(
            txid=row["txid"],
            vout_n=row["vout_n"],
            block_height=row["block_height"],
            block_time=row["block_time"],
            value_sats=row["value_sats"],
            script_pubkey=row["script_pubkey"],
            script_type=row["script_type"],
            address=row["address"],
            descriptor=row["descriptor"],
        )

    def fetch_prevout_snapshot_reference(self, txid: str, vout_n: int) -> OutputReference | None:
        try:
            with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      txid,
                      vout_n,
                      block_height,
                      block_time,
                      value_sats,
                      script_pubkey,
                      script_type,
                      address,
                      descriptor
                    FROM btc_prevout_snapshots
                    WHERE txid = %s AND vout_n = %s
                    """,
                    (txid, vout_n),
                )
                row = cur.fetchone()
        except psycopg.errors.UndefinedTable:
            return None
        if row is None:
            return None
        return OutputReference(
            txid=row["txid"],
            vout_n=row["vout_n"],
            block_height=row["block_height"],
            block_time=row["block_time"],
            value_sats=row["value_sats"],
            script_pubkey=row["script_pubkey"],
            script_type=row["script_type"],
            address=row["address"],
            descriptor=row["descriptor"],
        )

    def build_daily_metrics(self, day: date) -> list[DailyMetricRow]:
        with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT height
                FROM btc_blocks
                WHERE block_time < (%s::date + INTERVAL '1 day')
                ORDER BY block_time DESC, height DESC
                LIMIT 1
                """,
                (day,),
            )
            latest_block_row = cur.fetchone()
            latest_height_before_day = (
                int(latest_block_row["height"]) if latest_block_row and latest_block_row["height"] is not None else None
            )
            issued_supply_sats = issued_supply_sats_through_height(latest_height_before_day)

            cur.execute(
                """
                WITH bounds AS (
                  SELECT
                    %(target_day)s::date AS day_start,
                    (%(target_day)s::date + INTERVAL '1 day') AS day_end
                ),
                day_blocks AS (
                  SELECT b.height
                  FROM btc_blocks b
                  JOIN bounds s ON TRUE
                  WHERE b.block_time >= s.day_start
                    AND b.block_time < s.day_end
                ),
                day_spent AS (
                  SELECT se.spending_txid, se.value_sats, se.age_seconds
                  FROM btc_spent_edges se
                  JOIN bounds s ON TRUE
                  WHERE se.spending_time >= s.day_start
                    AND se.spending_time < s.day_end
                ),
                window_spent AS (
                  SELECT se.spending_time, se.value_sats
                  FROM btc_spent_edges se
                  JOIN bounds s ON TRUE
                  WHERE se.spending_time >= s.day_start - INTERVAL '89 day'
                    AND se.spending_time < s.day_end
                ),
                windows AS (
                  SELECT * FROM (
                    VALUES
                      ('30d', 29),
                      ('90d', 89)
                  ) AS window_defs(window_name, lookback_days)
                ),
                active_window AS (
                  SELECT
                    window_defs.window_name,
                    COALESCE(
                      SUM(window_spent.value_sats) FILTER (
                        WHERE window_spent.spending_time >= s.day_start - ((window_defs.lookback_days || ' day')::interval)
                      ),
                      0
                    )::numeric AS spent_sats
                  FROM windows window_defs
                  CROSS JOIN bounds s
                  LEFT JOIN window_spent ON TRUE
                  GROUP BY window_defs.window_name
                ),
                age_bands AS (
                  SELECT * FROM (
                    VALUES
                      ('lt_1d', 0, 86400),
                      ('1d_1w', 86400, 604800),
                      ('1w_1m', 604800, 2592000),
                      ('1m_3m', 2592000, 7776000),
                      ('3m_6m', 7776000, 15552000),
                      ('6m_1y', 15552000, 31536000),
                      ('1y_plus', 31536000, NULL::BIGINT)
                  ) AS bands(dimension_key, lower_seconds, upper_seconds)
                )
                SELECT
                  metric_rows.day,
                  metric_rows.metric_name,
                  metric_rows.metric_value,
                  metric_rows.unit,
                  metric_rows.dimension_key,
                  metric_rows.dimensions
                FROM (
                  SELECT
                    s.day_start AS day,
                    'created_utxo_count'::TEXT AS metric_name,
                    COUNT(o.txid)::numeric AS metric_value,
                    'count'::TEXT AS unit,
                    'all'::TEXT AS dimension_key,
                    '{}'::jsonb AS dimensions
                  FROM bounds s
                  LEFT JOIN day_blocks b ON TRUE
                  LEFT JOIN btc_outputs o ON o.block_height = b.height
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_utxo_count',
                    COUNT(day_spent.spending_txid)::numeric,
                    'count',
                    'all',
                    '{}'::jsonb
                  FROM bounds s
                  LEFT JOIN day_spent ON TRUE
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_btc',
                    COALESCE(SUM(day_spent.value_sats), 0)::numeric / 100000000,
                    'btc',
                    'all',
                    '{}'::jsonb
                  FROM bounds s
                  LEFT JOIN day_spent ON TRUE
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'dormant_reactivated_btc',
                    COALESCE(SUM(day_spent.value_sats), 0)::numeric / 100000000,
                    'btc',
                    'all',
                    jsonb_build_object('minimum_days', 180)
                  FROM bounds s
                  LEFT JOIN day_spent
                    ON day_spent.age_seconds >= 180 * 86400
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'active_supply_ratio',
                    CASE
                      WHEN %(issued_supply_sats)s::numeric = 0 THEN 0
                      ELSE ROUND((windowed.spent_sats / %(issued_supply_sats)s::numeric) * 100, 6)
                    END,
                    'percent',
                    windowed.window_name,
                    jsonb_build_object('window', windowed.window_name)
                  FROM bounds s
                  JOIN active_window windowed ON TRUE

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_btc_age_band',
                    COALESCE(SUM(day_spent.value_sats), 0)::numeric / 100000000,
                    'btc',
                    band.dimension_key,
                    jsonb_build_object('band', band.dimension_key)
                  FROM bounds s
                  JOIN age_bands band ON TRUE
                  LEFT JOIN day_spent
                    ON day_spent.age_seconds >= band.lower_seconds
                   AND (band.upper_seconds IS NULL OR day_spent.age_seconds < band.upper_seconds)
                  GROUP BY s.day_start, band.dimension_key
                ) metric_rows
                ORDER BY metric_rows.metric_name, metric_rows.dimension_key
                """,
                {"target_day": day, "issued_supply_sats": issued_supply_sats},
            )
            rows = cur.fetchall()
        return [
            DailyMetricRow(
                day=row["day"],
                metric_name=row["metric_name"],
                metric_value=float(row["metric_value"]),
                unit=row["unit"],
                dimension_key=row["dimension_key"],
                dimensions=row["dimensions"] or {},
            )
            for row in rows
        ]

    def build_entity_flow_rows(self, day: date, network: str) -> list[EntityFlowRow]:
        with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                """
                WITH labels AS (
                  SELECT entity_slug, target_kind, target_value
                  FROM btc_entity_labels
                ),
                received AS (
                  SELECT
                    label.entity_slug,
                    COALESCE(SUM(o.value_sats), 0)::BIGINT AS received_sats,
                    COUNT(DISTINCT o.txid)::INTEGER AS received_tx_count
                  FROM btc_outputs o
                  JOIN btc_blocks b ON b.height = o.block_height
                  JOIN labels label
                    ON (label.target_kind = 'address' AND label.target_value = o.address)
                    OR (label.target_kind = 'script_pubkey' AND label.target_value = o.script_pubkey)
                  WHERE b.block_time >= %(target_day)s::date
                    AND b.block_time < (%(target_day)s::date + INTERVAL '1 day')
                  GROUP BY label.entity_slug
                ),
                sent AS (
                  SELECT
                    label.entity_slug,
                    COALESCE(SUM(se.value_sats), 0)::BIGINT AS sent_sats,
                    COUNT(DISTINCT se.spending_txid)::INTEGER AS sent_tx_count
                  FROM btc_spent_edges se
                  JOIN labels label
                    ON (label.target_kind = 'address' AND label.target_value = se.prev_address)
                    OR (label.target_kind = 'script_pubkey' AND label.target_value = se.prev_script_pubkey)
                  WHERE se.spending_time >= %(target_day)s::date
                    AND se.spending_time < (%(target_day)s::date + INTERVAL '1 day')
                  GROUP BY label.entity_slug
                ),
                entities AS (
                  SELECT entity_slug FROM received
                  UNION
                  SELECT entity_slug FROM sent
                )
                SELECT
                  %(target_day)s::date AS day,
                  entities.entity_slug,
                  COALESCE(received.received_sats, 0) AS received_sats,
                  COALESCE(sent.sent_sats, 0) AS sent_sats,
                  COALESCE(received.received_sats, 0) - COALESCE(sent.sent_sats, 0) AS netflow_sats,
                  GREATEST(COALESCE(received.received_tx_count, 0), COALESCE(sent.sent_tx_count, 0)) AS tx_count
                FROM entities
                LEFT JOIN received USING (entity_slug)
                LEFT JOIN sent USING (entity_slug)
                ORDER BY entities.entity_slug
                """,
                {"target_day": day},
            )
            rows = cur.fetchall()
        return [
            EntityFlowRow(
                day=row["day"],
                entity_slug=row["entity_slug"],
                network=network,
                received_sats=row["received_sats"],
                sent_sats=row["sent_sats"],
                netflow_sats=row["netflow_sats"],
                tx_count=row["tx_count"],
            )
            for row in rows
        ]
