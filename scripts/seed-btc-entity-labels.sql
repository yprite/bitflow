INSERT INTO btc_entity_labels (
  entity_slug,
  label_type,
  target_kind,
  target_value,
  confidence,
  source,
  metadata
)
VALUES
  (
    'binance',
    'exchange',
    'address',
    'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h',
    0.7500,
    'public-tagged-wallet',
    jsonb_build_object(
      'notes',
      'Seeded from publicly tagged Binance wallet references to bootstrap exchange flow views.'
    )
  ),
  (
    'bitfinex',
    'exchange',
    'address',
    '1Kr6QSydW9bFQG1mXiPNNu6WpJGmUa9i1g',
    0.8000,
    'public-tagged-wallet',
    jsonb_build_object(
      'notes',
      'Seeded from publicly tagged Bitfinex wallet references to bootstrap exchange flow views.'
    )
  ),
  (
    'coinbase-prime',
    'exchange',
    'address',
    '3MqUP6G1daVS5YTD8fz3QgwjZortWwxXFd',
    0.7000,
    'public-tagged-wallet',
    jsonb_build_object(
      'notes',
      'Seeded from publicly tagged Coinbase institutional wallet references to bootstrap exchange flow views.'
    )
  ),
  (
    'crypto-com',
    'exchange',
    'address',
    'bc1q7cyrfmck2ffu2ud3rn5l5a8yv6f0chkp0zpemf',
    0.7000,
    'public-tagged-wallet',
    jsonb_build_object(
      'notes',
      'Seeded from publicly tagged Crypto.com wallet references to bootstrap exchange flow views.'
    )
  )
ON CONFLICT (entity_slug, target_kind, target_value)
DO UPDATE SET
  label_type = EXCLUDED.label_type,
  confidence = EXCLUDED.confidence,
  source = EXCLUDED.source,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
