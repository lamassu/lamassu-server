const db = require('../../lib/db')

const loadDummyTxData = () => {
  const sql = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  INSERT INTO customers
  VALUES ('99ac9999-9999-99e9-9999-9f99a9999999', null, null, null, null, null, null, 
  'load_test_customers', null, null, null, null, null, null, '2021-04-16 10:51:38',
  'automatic', null, null, 'automatic', null, null, 'automatic', null, null, 'automatic',
   null, null, 'automatic', null, null, 'automatic', null, null, null, null,
   null, null, null, 'automatic', null, null, null)
  ON CONFLICT DO NOTHING;

  INSERT INTO cash_in_txs
  SELECT uuid_generate_v4(), md5(random()::text), md5(random()::text), i::integer, 'BTC',
   i::integer, 'EUR', null, null, null, null, now() - random() * INTERVAL '2 days', random() > 0.5,
   random() > 0.5, random() > 0.5, now() - random() * INTERVAL '2 days', null, random() > 0.5,
   random() > 0.5, i::integer, i::integer, 1, '99ac9999-9999-99e9-9999-9f99a9999999',
   6, random() > 0.5, random() * (0.9-0.1) + 0.1::int, i::integer, random() > 0.5, null
  FROM generate_series(1, 5000000) as t(i);

  INSERT INTO cash_out_txs
  SELECT uuid_generate_v4(), md5(random()::text), md5(random()::text), i::integer, 'BTC',
   i::integer, 'EUR', 'confirmed', random() > 0.5, random() > 0.5, random() > 0.5,
   null, null, now() - random() * INTERVAL '2 days', now() - random() * INTERVAL '2 days', null,
   random() > 0.5, random() > 0.5, random() > 0.5, 0, 1, 20, 50, null, '99ac9999-9999-99e9-9999-9f99a9999999',
   random() * (40-1) + 1::int, now() - random() * INTERVAL '2 days', random() > 0.5, null,
   random() * (0.9-0.1) + 0.1::int, i::integer, i::integer, null
  FROM generate_series(1, 5000000) as t(i);

  INSERT INTO logs
  SELECT uuid_generate_v4(), md5(random()::text), 'info', now() - random() * INTERVAL '2 days',
   'message', now() - random() * INTERVAL '2 days',0
  FROM generate_series(1, 5000000) as t(i);

  INSERT INTO bills
  SELECT uuid_generate_v4(), i::integer, 'USD', '3d92c323-58c6-4172-9f30-91b80f0c653c',
  i::integer, '2021-04-16 11:51:38', 'BTC', i::integer
  FROM generate_series(1, 5000000) as t(i);
  
  `
  db.none(sql)
}

loadDummyTxData()
