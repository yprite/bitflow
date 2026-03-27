# Onchain Metric Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Bitflow's on-chain metric stack with durable state tables, a backward-compatible metric catalog, and grouped public `/onchain` views for supply, entity-pressure, and valuation metrics.

**Architecture:** Build the new state/materialization pipeline in Python first so the data model is stable before touching the web layer. Then refactor the TypeScript on-chain data layer around a catalog model that preserves the existing six public metric keys as stable aliases, expose the new grouped APIs, and finally wire the public `/onchain` pages to render core and experimental metrics separately.

**Tech Stack:** Next.js 14 App Router, TypeScript 5, Vitest 4, Python 3.12, psycopg 3, Supabase Postgres, SQL migrations

---

## File Map

### Data / worker foundation

- Create: `supabase/migrations/008_onchain_metric_expansion.sql`
- Create: `python/src/bitflow_onchain/metric_formulas.py`
- Create: `python/src/bitflow_onchain/entity_roles.py`
- Create: `python/src/bitflow_onchain/pipelines/reference_prices.py`
- Create: `python/tests/conftest.py`
- Create: `python/tests/test_metric_formulas.py`
- Create: `python/tests/test_postgres_store_models.py`
- Create: `python/tests/test_supply_metrics.py`
- Create: `python/tests/test_entity_metrics.py`
- Create: `python/tests/test_reference_prices.py`
- Modify: `python/pyproject.toml`
- Modify: `python/README.md`
- Modify: `python/src/bitflow_onchain/models.py`
- Modify: `python/src/bitflow_onchain/clients/postgres.py`
- Modify: `python/src/bitflow_onchain/pipelines/metrics.py`
- Modify: `python/src/bitflow_onchain/main.py`

### Web data layer / APIs

- Create: `src/lib/onchain-catalog.ts`
- Create: `src/lib/onchain-sections.ts`
- Create: `src/lib/onchain-sections.test.ts`
- Create: `src/app/api/onchain/catalog/route.ts`
- Create: `src/app/api/onchain/catalog/route.test.ts`
- Create: `src/app/api/onchain/metrics/route.test.ts`
- Create: `src/app/api/onchain/summary/route.test.ts`
- Create: `src/app/api/admin/onchain/route.test.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/onchain.ts`
- Modify: `src/lib/onchain.test.ts`
- Modify: `src/app/api/onchain/summary/route.ts`
- Modify: `src/app/api/onchain/metrics/route.ts`
- Modify: `src/app/api/admin/onchain/route.ts`
- Modify: `scripts/sync-onchain-to-supabase.mjs`

### Public UI / ops

- Create: `src/components/onchain-metric-section.tsx`
- Modify: `src/components/onchain-metric-card.tsx`
- Modify: `src/components/onchain-guide-card.tsx`
- Modify: `src/app/onchain/page.tsx`
- Modify: `src/app/desktop/onchain/page.tsx`
- Modify: `scripts/prune-onchain-postgres.sh`
- Modify: `README.md`

## Guardrails

- Keep the existing six public metric keys working through `/api/onchain/metrics?metric=<key>`.
- Treat `coinbase_spent_btc` as an internal materialized base series; only `miner_distribution_btc` is public.
- Keep catalog metadata separate from runtime state:
  - Catalog: `tier`, `visibility`, `lifecycleStatus`
  - Runtime: `materializationStatus`, `latestCalculatedAt`, `coverageDays`, `sourceState`
- Do not rely on forward-filling missing reference prices.
- Do not let retention jobs delete `btc_daily_metrics`, `btc_entity_flow_daily`, or the new state tables in phase 1.

## Verification Commands

- JS/TS unit tests: `npm test -- src/lib/onchain.test.ts src/lib/onchain-monitor.test.ts src/lib/onchain-sections.test.ts src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.test.ts`
- TypeScript compile check: `npm run typecheck`
- Python unit tests: `cd python && python -m pytest tests/test_metric_formulas.py tests/test_postgres_store_models.py tests/test_supply_metrics.py tests/test_entity_metrics.py tests/test_reference_prices.py -q`
- Full web regression smoke: `npm test`

### Task 1: Add Python test harness and formula helpers

**Files:**
- Create: `python/tests/conftest.py`
- Create: `python/tests/test_metric_formulas.py`
- Create: `python/src/bitflow_onchain/metric_formulas.py`
- Create: `python/src/bitflow_onchain/entity_roles.py`
- Modify: `python/pyproject.toml`

- [ ] **Step 1: Write the failing formula and role-normalization tests**

```python
from bitflow_onchain.entity_roles import normalize_role_label
from bitflow_onchain.metric_formulas import calculate_dormancy, calculate_liveliness

def test_normalize_role_label_maps_existing_values():
    assert normalize_role_label("exchange") == "exchange"
    assert normalize_role_label("pool") == "miner"
    assert normalize_role_label("custodian") == "custody"
    assert normalize_role_label("mystery") == "unknown"

def test_dormancy_returns_none_when_spent_btc_is_zero():
    assert calculate_dormancy(coin_days_destroyed=125.0, spent_btc=0.0) is None

def test_liveliness_divides_destroyed_by_created():
    assert calculate_liveliness(40.0, 100.0) == 0.4
```

- [ ] **Step 2: Run the Python tests to verify they fail**

Run: `cd python && python -m pytest tests/test_metric_formulas.py -q`
Expected: FAIL because the test file imports modules that do not exist yet.

- [ ] **Step 3: Add pytest dev support and implement the helper modules**

```python
# python/src/bitflow_onchain/entity_roles.py
ROLE_MAP = {
    "exchange": "exchange",
    "miner": "miner",
    "mining_pool": "miner",
    "pool": "miner",
    "custody": "custody",
    "custodian": "custody",
}

def normalize_role_label(label: str | None) -> str:
    return ROLE_MAP.get((label or "").strip().lower(), "unknown")
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run: `cd python && python -m pytest tests/test_metric_formulas.py -q`
Expected: PASS with the new helper modules and `pytest` available via `python/pyproject.toml`.

- [ ] **Step 5: Commit**

```bash
git add python/pyproject.toml python/tests/conftest.py python/tests/test_metric_formulas.py python/src/bitflow_onchain/metric_formulas.py python/src/bitflow_onchain/entity_roles.py
git commit -m "test: add onchain metric helper coverage"
```

### Task 2: Add migration and store-layer row models for the new state tables

**Files:**
- Create: `supabase/migrations/008_onchain_metric_expansion.sql`
- Create: `python/tests/test_postgres_store_models.py`
- Modify: `python/src/bitflow_onchain/models.py`
- Modify: `python/src/bitflow_onchain/clients/postgres.py`

- [ ] **Step 1: Write failing tests for the new row models and store helpers**

```python
from bitflow_onchain.models import ReferencePriceRow, SupplyBandRow, RealizedStateRow, EntityBalanceRow

def test_reference_price_row_has_status_field():
    row = ReferencePriceRow(day=date(2026, 3, 27), close_usd=87000.0, source="coingecko", status="final")
    assert row.status == "final"

def test_entity_balance_row_tracks_coinbase_flow_columns():
    row = EntityBalanceRow(
        day=date(2026, 3, 27),
        entity_slug="binance",
        role="exchange",
        received_sats=1,
        sent_sats=2,
        netflow_sats=-1,
        estimated_balance_sats=10,
        coinbase_inflow_sats=0,
        coinbase_outflow_sats=3,
    )
    assert row.coinbase_outflow_sats == 3
```

- [ ] **Step 2: Run the row-model tests to verify they fail**

Run: `cd python && python -m pytest tests/test_postgres_store_models.py -q`
Expected: FAIL because the dataclasses and store helpers are missing.

- [ ] **Step 3: Implement the migration, dataclasses, and upsert helpers**

```sql
CREATE TABLE IF NOT EXISTS btc_reference_prices (...);
CREATE TABLE IF NOT EXISTS btc_daily_supply_bands (...);
CREATE TABLE IF NOT EXISTS btc_daily_realized_state (...);
CREATE TABLE IF NOT EXISTS btc_entity_balance_daily (...);
```

- [ ] **Step 4: Run the model/store tests**

Run: `cd python && python -m pytest tests/test_postgres_store_models.py -q`
Expected: PASS with the new dataclasses and Postgres helper signatures in place.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/008_onchain_metric_expansion.sql python/src/bitflow_onchain/models.py python/src/bitflow_onchain/clients/postgres.py python/tests/test_postgres_store_models.py
git commit -m "feat: add onchain metric state tables"
```

### Task 3: Materialize supply-structure state and metrics

**Files:**
- Create: `python/tests/test_supply_metrics.py`
- Modify: `python/src/bitflow_onchain/clients/postgres.py`
- Modify: `python/src/bitflow_onchain/pipelines/metrics.py`
- Modify: `python/src/bitflow_onchain/metric_formulas.py`
- Modify: `python/src/bitflow_onchain/models.py`

- [ ] **Step 1: Write failing tests for supply-band metrics**

```python
def test_supply_metrics_include_new_windows_and_age_shares():
    rows = build_supply_metric_rows(...)
    metric_names = {(row.metric_name, row.dimension_key) for row in rows}
    assert ("active_supply_ratio", "7d") in metric_names
    assert ("active_supply_ratio", "180d") in metric_names
    assert ("supply_age_share", "1y_2y") in metric_names
    assert ("illiquid_supply_proxy", "all") in metric_names

def test_dormancy_returns_unavailable_when_spent_btc_is_zero():
    rows = build_supply_metric_rows(...)
    dormancy = next(row for row in rows if row.metric_name == "dormancy")
    assert dormancy.metric_value is None
```

- [ ] **Step 2: Run the supply tests to verify they fail**

Run: `cd python && python -m pytest tests/test_supply_metrics.py -q`
Expected: FAIL because the worker does not emit the new supply rows yet.

- [ ] **Step 3: Implement supply-band state queries and metric materialization**

```python
# python/src/bitflow_onchain/pipelines/metrics.py
reference_rows = store.build_reference_price_rows(...)
supply_band_rows = store.build_supply_band_rows(...)
supply_metric_rows = store.build_supply_metric_rows(...)
store.replace_supply_bands(...)
store.replace_daily_metrics(day, supply_metric_rows + ...)
```

- [ ] **Step 4: Run the supply test suite**

Run: `cd python && python -m pytest tests/test_supply_metrics.py tests/test_metric_formulas.py -q`
Expected: PASS with `active_supply_ratio_7d/180d`, `supply_age_share`, `coin_days_destroyed`, `dormancy`, `liveliness`, and proxy rows materialized.

- [ ] **Step 5: Commit**

```bash
git add python/src/bitflow_onchain/clients/postgres.py python/src/bitflow_onchain/pipelines/metrics.py python/src/bitflow_onchain/metric_formulas.py python/src/bitflow_onchain/models.py python/tests/test_supply_metrics.py
git commit -m "feat: materialize onchain supply metrics"
```

### Task 4: Materialize entity-pressure metrics and role-aware state

**Files:**
- Create: `python/tests/test_entity_metrics.py`
- Modify: `python/src/bitflow_onchain/entity_roles.py`
- Modify: `python/src/bitflow_onchain/clients/postgres.py`
- Modify: `python/src/bitflow_onchain/pipelines/metrics.py`

- [ ] **Step 1: Write failing tests for role normalization and entity metrics**

```python
def test_exchange_netflow_skips_unknown_role_entities():
    rows = build_entity_metric_rows(...)
    exchange_rows = [row for row in rows if row.metric_name == "exchange_netflow"]
    assert all(row.dimensions["role"] == "exchange" for row in exchange_rows)

def test_miner_distribution_is_public_metric_but_coinbase_spent_is_internal_only():
    rows = build_entity_metric_rows(...)
    assert any(row.metric_name == "miner_distribution_btc" for row in rows)
    assert all(row.metric_name != "coinbase_spent_btc" for row in public_rows(rows))
```

- [ ] **Step 2: Run the entity tests to verify they fail**

Run: `cd python && python -m pytest tests/test_entity_metrics.py -q`
Expected: FAIL because the worker does not build `btc_entity_balance_daily` rows or the new metrics yet.

- [ ] **Step 3: Implement entity-balance rows and public/internal metric split**

```python
normalized_role = normalize_role_label(label_type)
resolved_role = choose_entity_role(["miner", "exchange"])  # returns "exchange"
entity_balance_rows = store.build_entity_balance_rows(target_day, network=settings.network)
entity_metric_rows = store.build_entity_metric_rows(target_day, network=settings.network)
```

- [ ] **Step 4: Run the entity tests**

Run: `cd python && python -m pytest tests/test_entity_metrics.py tests/test_metric_formulas.py -q`
Expected: PASS with `exchange_netflow_7d/30d`, `entity_flow_concentration`, `miner_distribution_btc`, and proxy rows behaving per spec.

- [ ] **Step 5: Commit**

```bash
git add python/src/bitflow_onchain/entity_roles.py python/src/bitflow_onchain/clients/postgres.py python/src/bitflow_onchain/pipelines/metrics.py python/tests/test_entity_metrics.py
git commit -m "feat: add entity pressure metrics"
```

### Task 5: Add reference-price refresh and valuation metrics

**Files:**
- Create: `python/src/bitflow_onchain/pipelines/reference_prices.py`
- Create: `python/tests/test_reference_prices.py`
- Modify: `python/src/bitflow_onchain/main.py`
- Modify: `python/src/bitflow_onchain/clients/postgres.py`
- Modify: `python/src/bitflow_onchain/pipelines/metrics.py`
- Modify: `python/src/bitflow_onchain/metric_formulas.py`

- [ ] **Step 1: Write failing tests for final/provisional prices and valuation metrics**

```python
def test_reference_price_marks_latest_open_day_as_provisional():
    row = build_reference_price_row(...)
    assert row.status == "provisional"

def test_sopr_returns_none_when_cost_basis_is_zero():
    assert calculate_sopr(spent_value_realized_usd=50.0, spent_value_cost_basis_usd=0.0) is None

def test_realized_metrics_emit_mvrv_and_sth_lth_sopr():
    rows = build_valuation_metric_rows(...)
    names = {row.metric_name for row in rows}
    assert {"realized_cap", "realized_price", "mvrv", "sopr", "sth_sopr", "lth_sopr"} <= names
```

- [ ] **Step 2: Run the valuation tests to verify they fail**

Run: `cd python && python -m pytest tests/test_reference_prices.py -q`
Expected: FAIL because the refresh pipeline and valuation materialization do not exist yet.

- [ ] **Step 3: Implement reference-price ingestion and valuation state builders**

```python
# python/src/bitflow_onchain/main.py
subparsers.add_parser("reference-prices")

# python/src/bitflow_onchain/pipelines/reference_prices.py
def run_reference_price_refresh(...): ...
```

- [ ] **Step 4: Run the valuation tests**

Run: `cd python && python -m pytest tests/test_reference_prices.py tests/test_metric_formulas.py -q`
Expected: PASS with `final` vs `provisional` handling and valuation metrics following the spec formulas.

- [ ] **Step 5: Commit**

```bash
git add python/src/bitflow_onchain/pipelines/reference_prices.py python/src/bitflow_onchain/main.py python/src/bitflow_onchain/clients/postgres.py python/src/bitflow_onchain/pipelines/metrics.py python/src/bitflow_onchain/metric_formulas.py python/tests/test_reference_prices.py
git commit -m "feat: add valuation metric pipeline"
```

### Task 6: Refactor the TypeScript data layer around a backward-compatible metric catalog

**Files:**
- Create: `src/lib/onchain-catalog.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/onchain.ts`
- Modify: `src/lib/onchain.test.ts`

- [ ] **Step 1: Write failing tests for catalog aliasing and runtime metadata**

```ts
it('keeps spent_btc as the default public metric', () => {
  expect(resolveMetricRequest(undefined)).toBe('spent_btc');
});

it('maps legacy metric ids to catalog entries', () => {
  expect(getOnchainMetricCatalogEntry('active_supply_ratio_30d')?.family).toBe('supply');
});

it('separates lifecycle status from materialization status', () => {
  const metric = buildCatalogMetricSummary(...);
  expect(metric.lifecycleStatus).toBe('stable');
  expect(metric.materializationStatus).toBe('available');
});
```

- [ ] **Step 2: Run the TS on-chain tests to verify they fail**

Run: `npm test -- src/lib/onchain.test.ts`
Expected: FAIL because the catalog helpers and runtime fields do not exist yet.

- [ ] **Step 3: Implement the catalog module and compatibility layer**

```ts
export const LEGACY_PUBLIC_ONCHAIN_METRIC_IDS = [
  'created_utxo_count',
  'spent_utxo_count',
  'spent_btc',
  'dormant_reactivated_btc',
  'active_supply_ratio_30d',
  'active_supply_ratio_90d',
] as const;
```

- [ ] **Step 4: Run the TS on-chain tests**

Run: `npm test -- src/lib/onchain.test.ts`
Expected: PASS with catalog-driven summaries and the old metric route contract preserved.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onchain-catalog.ts src/lib/types.ts src/lib/onchain.ts src/lib/onchain.test.ts
git commit -m "feat: add backward-compatible onchain metric catalog"
```

### Task 7: Expose grouped metric APIs and admin runtime metadata

**Files:**
- Create: `src/app/api/onchain/catalog/route.ts`
- Create: `src/app/api/onchain/catalog/route.test.ts`
- Create: `src/app/api/onchain/metrics/route.test.ts`
- Create: `src/app/api/onchain/summary/route.test.ts`
- Create: `src/app/api/admin/onchain/route.test.ts`
- Modify: `src/app/api/onchain/summary/route.ts`
- Modify: `src/app/api/onchain/metrics/route.ts`
- Modify: `src/app/api/admin/onchain/route.ts`
- Modify: `src/lib/onchain.ts`
- Modify: `scripts/sync-onchain-to-supabase.mjs`

- [ ] **Step 1: Write failing route tests for default, single-metric, collection, summary, and admin contracts**

```ts
it('defaults /api/onchain/metrics to spent_btc when no params are set', async () => {
  const response = await GET(new Request('http://localhost/api/onchain/metrics'));
  expect(response.status).toBe(200);
});

it('returns 400 when metric and family filters are combined', async () => {
  const response = await GET(new Request('http://localhost/api/onchain/metrics?metric=spent_btc&family=supply'));
  expect(response.status).toBe(400);
});

it('returns grouped summary fields for /api/onchain/summary', async () => {
  const response = await GET(new Request('http://localhost/api/onchain/summary'));
  const payload = await response.json();
  expect(payload).toHaveProperty('metricGroups');
  expect(payload).toHaveProperty('featuredMetrics');
  expect(payload).toHaveProperty('experimentalMetrics');
});

it('returns runtime coverage metadata for /api/admin/onchain', async () => {
  const response = await GET(new Request('http://localhost/api/admin/onchain'));
  const payload = await response.json();
  expect(payload).toHaveProperty('metricCoverage');
  expect(payload).toHaveProperty('stateTableFreshness');
});
```

- [ ] **Step 2: Run the route tests to verify they fail**

Run: `npm test -- src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.test.ts src/app/api/onchain/summary/route.test.ts src/app/api/admin/onchain/route.test.ts`
Expected: FAIL because the catalog route, expanded summary/admin payloads, and collection behavior do not exist yet.

- [ ] **Step 3: Implement the catalog route, publish path updates, collection mode, summary groups, and admin metadata**

```ts
// collection mode
return NextResponse.json({
  metrics,
  filters: { family, tier, visibility, days },
  total: metrics.length,
  updatedAt: new Date().toISOString(),
});
```

```js
// scripts/sync-onchain-to-supabase.mjs
metric_name: catalogKey,
metadata: {
  family,
  tier,
  visibility,
  lifecycleStatus,
}
```

- [ ] **Step 4: Run the route tests and typecheck**

Run: `npm test -- src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.test.ts src/app/api/onchain/summary/route.test.ts src/app/api/admin/onchain/route.test.ts && npm run typecheck`
Expected: PASS with the route contracts and Supabase publish path matching the spec.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/onchain/catalog/route.ts src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.ts src/app/api/onchain/metrics/route.test.ts src/app/api/onchain/summary/route.ts src/app/api/onchain/summary/route.test.ts src/app/api/admin/onchain/route.ts src/app/api/admin/onchain/route.test.ts src/lib/onchain.ts scripts/sync-onchain-to-supabase.mjs
git commit -m "feat: expose grouped onchain metric APIs"
```

### Task 8: Group metrics into public `/onchain` sections and render core vs experimental states

**Files:**
- Create: `src/lib/onchain-sections.ts`
- Create: `src/lib/onchain-sections.test.ts`
- Create: `src/components/onchain-metric-section.tsx`
- Modify: `src/components/onchain-metric-card.tsx`
- Modify: `src/components/onchain-guide-card.tsx`
- Modify: `src/app/onchain/page.tsx`
- Modify: `src/app/desktop/onchain/page.tsx`

- [ ] **Step 1: Write failing tests for section grouping and visibility rules**

```ts
it('groups public supply metrics ahead of experimental metrics', () => {
  const sections = buildOnchainMetricSections(sampleMetrics);
  expect(sections[0]?.key).toBe('supply');
  expect(sections.at(-1)?.key).toBe('experimental');
});

it('hides unavailable experimental metrics from the featured area', () => {
  const sections = buildOnchainMetricSections(sampleMetrics);
  expect(sections.find((section) => section.key === 'featured')?.metrics).not.toContainEqual(
    expect.objectContaining({ materializationStatus: 'unavailable', tier: 'proxy' })
  );
});
```

- [ ] **Step 2: Run the section tests to verify they fail**

Run: `npm test -- src/lib/onchain-sections.test.ts`
Expected: FAIL because the section builder and new UI component do not exist yet.

- [ ] **Step 3: Implement the section builder and wire the public pages**

```ts
const sections = buildOnchainMetricSections(summary.metrics);
return (
  <>
    {sections.map((section) => (
      <OnchainMetricSection key={section.key} section={section} />
    ))}
  </>
);
```

- [ ] **Step 4: Run the section tests and the existing on-chain monitor tests**

Run: `npm test -- src/lib/onchain-sections.test.ts src/lib/onchain-monitor.test.ts`
Expected: PASS with the new grouped layout and existing briefing logic still intact.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onchain-sections.ts src/lib/onchain-sections.test.ts src/components/onchain-metric-section.tsx src/components/onchain-metric-card.tsx src/components/onchain-guide-card.tsx src/app/onchain/page.tsx src/app/desktop/onchain/page.tsx
git commit -m "feat: group onchain metrics for public pages"
```

### Task 9: Preserve long-history state during pruning and update operator docs

**Files:**
- Modify: `scripts/prune-onchain-postgres.sh`
- Modify: `README.md`
- Modify: `python/README.md`

- [ ] **Step 1: Add a manual regression checklist to the docs before changing the retention script**

```md
- Verify pruning no longer deletes `btc_daily_metrics`
- Verify pruning no longer deletes `btc_entity_flow_daily`
- Verify pruning no longer deletes `btc_reference_prices`, `btc_daily_supply_bands`, `btc_daily_realized_state`, `btc_entity_balance_daily`
```

- [ ] **Step 2: Run a dry review of the current retention script**

Run: `sed -n '1,220p' scripts/prune-onchain-postgres.sh`
Expected: CONFIRM it currently deletes historical serving rows and needs narrowing.

- [ ] **Step 3: Update the pruning script and operator docs**

```bash
# keep deleting raw block rows below prune height
# stop deleting long-history state/materialized tables needed for replay
```

- [ ] **Step 4: Run end-to-end verification**

Run: `cd python && python -m pytest tests/test_metric_formulas.py tests/test_postgres_store_models.py tests/test_supply_metrics.py tests/test_entity_metrics.py tests/test_reference_prices.py -q && cd .. && npm test -- src/lib/onchain.test.ts src/lib/onchain-monitor.test.ts src/lib/onchain-sections.test.ts src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.test.ts src/app/api/onchain/summary/route.test.ts src/app/api/admin/onchain/route.test.ts && npm run typecheck`
Expected: PASS with all new and existing targeted coverage green.

- [ ] **Step 5: Commit**

```bash
git add scripts/prune-onchain-postgres.sh README.md python/README.md
git commit -m "docs: document and preserve onchain metric retention"
```

## Final Verification

- [ ] Run `cd python && python -m pytest tests/test_metric_formulas.py tests/test_postgres_store_models.py tests/test_supply_metrics.py tests/test_entity_metrics.py tests/test_reference_prices.py -q`
- [ ] Run `npm test -- src/lib/onchain.test.ts src/lib/onchain-monitor.test.ts src/lib/onchain-sections.test.ts src/app/api/onchain/catalog/route.test.ts src/app/api/onchain/metrics/route.test.ts src/app/api/onchain/summary/route.test.ts src/app/api/admin/onchain/route.test.ts`
- [ ] Run `npm run typecheck`
- [ ] If all commands pass, create a final integration commit that only contains any follow-up fixes that were needed after task commits
