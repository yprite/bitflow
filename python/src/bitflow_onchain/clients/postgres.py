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

    def _persistable_spent_edges(
        self,
        cur: Any,
        rows: list[SpentEdgeRecord],
        block_height: int,
    ) -> list[dict[str, Any]]:
        if not rows:
            return []

        cur.execute(
            """
            WITH candidate_prevouts AS (
              SELECT DISTINCT prev_txid, prev_vout_n
              FROM jsonb_to_recordset(%s::jsonb) AS candidate(prev_txid TEXT, prev_vout_n INTEGER)
            )
            SELECT candidate.prev_txid, candidate.prev_vout_n
            FROM candidate_prevouts candidate
            JOIN btc_outputs o
              ON o.txid = candidate.prev_txid
             AND o.vout_n = candidate.prev_vout_n
            """,
            (
                psycopg.types.json.Jsonb(
                    [
                        {
                            "prev_txid": row.prev_txid,
                            "prev_vout_n": row.prev_vout_n,
                        }
                        for row in rows
                    ]
                ),
            ),
        )
        existing_prevouts = {(txid, vout_n) for txid, vout_n in cur.fetchall()}
        persisted_rows = [
            asdict(row)
            for row in rows
            if (row.prev_txid, row.prev_vout_n) in existing_prevouts
        ]
        skipped_rows = len(rows) - len(persisted_rows)
        if skipped_rows > 0:
            print(
                f"skipping {skipped_rows} spent edges with missing prevouts at height {block_height}"
            )
        return persisted_rows

    def upsert_block_bundle(self, bundle: BlockBundle) -> None:
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO btc_blocks (
                  height,
                  block_hash,
                  prev_block_hash,
                  block_time,
                  median_time,
                  size_bytes,
                  weight,
                  tx_count
                )
                VALUES (
                  %(height)s,
                  %(block_hash)s,
                  %(prev_block_hash)s,
                  %(block_time)s,
                  %(median_time)s,
                  %(size_bytes)s,
                  %(weight)s,
                  %(tx_count)s
                )
                ON CONFLICT (height) DO UPDATE SET
                  block_hash = EXCLUDED.block_hash,
                  prev_block_hash = EXCLUDED.prev_block_hash,
                  block_time = EXCLUDED.block_time,
                  median_time = EXCLUDED.median_time,
                  size_bytes = EXCLUDED.size_bytes,
                  weight = EXCLUDED.weight,
                  tx_count = EXCLUDED.tx_count,
                  updated_at = NOW()
                """,
                asdict(bundle.block),
            )

            self._executemany(
                cur,
                """
                INSERT INTO btc_txs (
                  txid,
                  block_height,
                  block_hash,
                  tx_index,
                  version,
                  lock_time,
                  size_bytes,
                  vsize,
                  weight,
                  is_coinbase,
                  fee_sats,
                  total_input_sats,
                  total_output_sats
                )
                VALUES (
                  %(txid)s,
                  %(block_height)s,
                  %(block_hash)s,
                  %(tx_index)s,
                  %(version)s,
                  %(lock_time)s,
                  %(size_bytes)s,
                  %(vsize)s,
                  %(weight)s,
                  %(is_coinbase)s,
                  %(fee_sats)s,
                  %(total_input_sats)s,
                  %(total_output_sats)s
                )
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
                """,
                [asdict(row) for row in bundle.txs],
            )

            self._executemany(
                cur,
                """
                INSERT INTO btc_outputs (
                  txid,
                  vout_n,
                  block_height,
                  value_sats,
                  script_pubkey,
                  script_type,
                  address,
                  descriptor,
                  is_op_return
                )
                VALUES (
                  %(txid)s,
                  %(vout_n)s,
                  %(block_height)s,
                  %(value_sats)s,
                  %(script_pubkey)s,
                  %(script_type)s,
                  %(address)s,
                  %(descriptor)s,
                  %(is_op_return)s
                )
                ON CONFLICT (txid, vout_n) DO UPDATE SET
                  block_height = EXCLUDED.block_height,
                  value_sats = EXCLUDED.value_sats,
                  script_pubkey = EXCLUDED.script_pubkey,
                  script_type = EXCLUDED.script_type,
                  address = EXCLUDED.address,
                  descriptor = EXCLUDED.descriptor,
                  is_op_return = EXCLUDED.is_op_return,
                  updated_at = NOW()
                """,
                [asdict(row) for row in bundle.outputs],
            )

            self._executemany(
                cur,
                """
                INSERT INTO btc_inputs (
                  spending_txid,
                  vin_n,
                  block_height,
                  prev_txid,
                  prev_vout_n,
                  sequence,
                  coinbase_data,
                  prev_value_sats,
                  prev_script_pubkey
                )
                VALUES (
                  %(spending_txid)s,
                  %(vin_n)s,
                  %(block_height)s,
                  %(prev_txid)s,
                  %(prev_vout_n)s,
                  %(sequence)s,
                  %(coinbase_data)s,
                  %(prev_value_sats)s,
                  %(prev_script_pubkey)s
                )
                ON CONFLICT (spending_txid, vin_n) DO UPDATE SET
                  block_height = EXCLUDED.block_height,
                  prev_txid = EXCLUDED.prev_txid,
                  prev_vout_n = EXCLUDED.prev_vout_n,
                  sequence = EXCLUDED.sequence,
                  coinbase_data = EXCLUDED.coinbase_data,
                  prev_value_sats = EXCLUDED.prev_value_sats,
                  prev_script_pubkey = EXCLUDED.prev_script_pubkey,
                  updated_at = NOW()
                """,
                [asdict(row) for row in bundle.inputs],
            )

            self._executemany(
                cur,
                """
                INSERT INTO btc_spent_edges (
                  spending_txid,
                  vin_n,
                  prev_txid,
                  prev_vout_n,
                  spending_block_height,
                  spending_time,
                  created_block_height,
                  created_time,
                  value_sats,
                  age_seconds
                )
                VALUES (
                  %(spending_txid)s,
                  %(vin_n)s,
                  %(prev_txid)s,
                  %(prev_vout_n)s,
                  %(spending_block_height)s,
                  %(spending_time)s,
                  %(created_block_height)s,
                  %(created_time)s,
                  %(value_sats)s,
                  %(age_seconds)s
                )
                ON CONFLICT (spending_txid, vin_n) DO UPDATE SET
                  prev_txid = EXCLUDED.prev_txid,
                  prev_vout_n = EXCLUDED.prev_vout_n,
                  spending_block_height = EXCLUDED.spending_block_height,
                  spending_time = EXCLUDED.spending_time,
                  created_block_height = EXCLUDED.created_block_height,
                  created_time = EXCLUDED.created_time,
                  value_sats = EXCLUDED.value_sats,
                  age_seconds = EXCLUDED.age_seconds,
                  updated_at = NOW()
                """,
                self._persistable_spent_edges(
                    cur,
                    bundle.spent_edges,
                    bundle.block.height,
                ),
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

    def build_daily_metrics(self, day: date) -> list[DailyMetricRow]:
        with psycopg.connect(self.dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                """
                WITH bounds AS (
                  SELECT
                    %(target_day)s::date AS day_start,
                    (%(target_day)s::date + INTERVAL '1 day') AS day_end
                ),
                issued_supply AS (
                  SELECT COALESCE(SUM(o.value_sats), 0)::numeric AS issued_sats
                  FROM btc_outputs o
                  JOIN btc_txs t ON t.txid = o.txid
                  JOIN btc_blocks b ON b.height = o.block_height
                  JOIN bounds s ON TRUE
                  WHERE t.is_coinbase = TRUE
                    AND b.block_time < s.day_end
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
                    COALESCE(SUM(se.value_sats), 0)::numeric AS spent_sats
                  FROM windows window_defs
                  CROSS JOIN bounds s
                  LEFT JOIN btc_spent_edges se
                    ON se.spending_time >= s.day_start - ((window_defs.lookback_days || ' day')::interval)
                   AND se.spending_time < s.day_end
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
                  LEFT JOIN btc_blocks b
                    ON b.block_time >= s.day_start
                   AND b.block_time < s.day_end
                  LEFT JOIN btc_outputs o ON o.block_height = b.height
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_utxo_count',
                    COUNT(se.spending_txid)::numeric,
                    'count',
                    'all',
                    '{}'::jsonb
                  FROM bounds s
                  LEFT JOIN btc_spent_edges se
                    ON se.spending_time >= s.day_start
                   AND se.spending_time < s.day_end
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_btc',
                    COALESCE(SUM(se.value_sats), 0)::numeric / 100000000,
                    'btc',
                    'all',
                    '{}'::jsonb
                  FROM bounds s
                  LEFT JOIN btc_spent_edges se
                    ON se.spending_time >= s.day_start
                   AND se.spending_time < s.day_end
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'dormant_reactivated_btc',
                    COALESCE(SUM(se.value_sats), 0)::numeric / 100000000,
                    'btc',
                    'all',
                    jsonb_build_object('minimum_days', 180)
                  FROM bounds s
                  LEFT JOIN btc_spent_edges se
                    ON se.spending_time >= s.day_start
                   AND se.spending_time < s.day_end
                   AND se.age_seconds >= 180 * 86400
                  GROUP BY s.day_start

                  UNION ALL

                  SELECT
                    s.day_start,
                    'active_supply_ratio',
                    CASE
                      WHEN supply.issued_sats = 0 THEN 0
                      ELSE ROUND((windowed.spent_sats / supply.issued_sats) * 100, 6)
                    END,
                    'percent',
                    windowed.window_name,
                    jsonb_build_object('window', windowed.window_name)
                  FROM bounds s
                  CROSS JOIN issued_supply supply
                  JOIN active_window windowed ON TRUE

                  UNION ALL

                  SELECT
                    s.day_start,
                    'spent_btc_age_band',
                    COALESCE(SUM(se.value_sats), 0)::numeric / 100000000,
                    'btc',
                    band.dimension_key,
                    jsonb_build_object('band', band.dimension_key)
                  FROM bounds s
                  JOIN age_bands band ON TRUE
                  LEFT JOIN btc_spent_edges se
                    ON se.spending_time >= s.day_start
                   AND se.spending_time < s.day_end
                   AND se.age_seconds >= band.lower_seconds
                   AND (band.upper_seconds IS NULL OR se.age_seconds < band.upper_seconds)
                  GROUP BY s.day_start, band.dimension_key
                ) metric_rows
                ORDER BY metric_rows.metric_name, metric_rows.dimension_key
                """,
                {"target_day": day},
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
                  JOIN btc_outputs o
                    ON o.txid = se.prev_txid
                   AND o.vout_n = se.prev_vout_n
                  JOIN labels label
                    ON (label.target_kind = 'address' AND label.target_value = o.address)
                    OR (label.target_kind = 'script_pubkey' AND label.target_value = o.script_pubkey)
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
