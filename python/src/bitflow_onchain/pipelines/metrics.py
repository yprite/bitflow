from __future__ import annotations

from datetime import date

from bitflow_onchain.clients.postgres import PostgresStore
from bitflow_onchain.config import Settings


def run_metrics(store: PostgresStore, settings: Settings, target_day: date) -> None:
    metric_rows = store.build_daily_metrics(target_day)
    entity_flow_rows = store.build_entity_flow_rows(target_day, network=settings.network)
    store.replace_daily_metrics(target_day, metric_rows)
    store.replace_entity_flow_daily(target_day, entity_flow_rows)
    print(
        "materialized",
        f"{len(metric_rows)} metric rows and {len(entity_flow_rows)} entity flow rows",
        f"for {target_day.isoformat()}",
    )
