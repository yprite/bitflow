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
