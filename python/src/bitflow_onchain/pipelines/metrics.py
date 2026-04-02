from __future__ import annotations

from datetime import date, timedelta

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


def run_metrics_range(
    store: PostgresStore,
    settings: Settings,
    start_day: date,
    end_day: date,
) -> None:
    if end_day < start_day:
        raise ValueError(
            f"metrics range end_day {end_day.isoformat()} is before start_day {start_day.isoformat()}"
        )

    current_day = start_day
    while current_day <= end_day:
        run_metrics(store=store, settings=settings, target_day=current_day)
        current_day += timedelta(days=1)
