var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var actions = ['published', 'authorized', 'instant', 'confirmed', 'rejected',
    'insufficientFunds', 'dispenseRequested', 'dispensed', 'notified',
    'addedPhone', 'redeem']
    .map(singleQuotify).join(',')

  var sql = [
    `create table cash_in_txs (
      session_id uuid PRIMARY KEY,
      device_fingerprint text NOT NULL,
      to_address text NOT NULL,
      crypto_atoms bigint NOT NULL,
      crypto_code text NOT NULL,
      fiat numeric(14, 5) NOT NULL,
      currency_code text NOT NULL,
      fee bigint,
      tx_hash text,
      phone text,
      error text,
      created timestamptz NOT NULL default now()
    )`,
    `create table cash_out_txs (
      session_id uuid PRIMARY KEY,
      device_fingerprint text NOT NULL,
      to_address text NOT NULL,
      crypto_atoms bigint NOT NULL,
      crypto_code text NOT NULL,
      fiat numeric(14, 5) NOT NULL,
      currency_code text NOT NULL,
      tx_hash text,
      status status_stage NOT NULL default \'notSeen\',
      dispensed boolean NOT NULL default false,
      notified boolean NOT NULL default false,
      redeem boolean NOT NULL default false,
      phone text,
      error text,
      created timestamptz NOT NULL default now(),
      confirmation_time timestamptz
    )`,
    `create type cash_out_action_types AS ENUM (${actions})`,
    `create table cash_out_actions (
      id serial PRIMARY KEY,
      session_id uuid REFERENCES cash_out_txs(session_id),
      action cash_out_action_types NOT NULL,
      created timestamptz NOT NULL default now()
    )`,
    `alter table dispenses add session_id uuid`,
    `alter table dispenses drop constraint dispenses_transaction_id_fkey`
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
