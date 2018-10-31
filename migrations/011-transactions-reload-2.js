var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var actions = ['published', 'authorized', 'instant', 'confirmed', 'rejected',
    'insufficientFunds', 'dispenseRequested', 'dispensed', 'notified',
    'addedPhone', 'redeem']
    .map(singleQuotify).join(',')

  var sql = [
    `CREATE TABLE IF NOT EXISTS cash_in_txs (
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
    `CREATE TABLE IF NOT EXISTS cash_out_txs (
      session_id uuid PRIMARY KEY,
      device_fingerprint text NOT NULL,
      to_address text NOT NULL,
      crypto_atoms bigint NOT NULL,
      crypto_code text NOT NULL,
      fiat numeric(14, 5) NOT NULL,
      currency_code text NOT NULL,
      tx_hash text,
      status status_stage NOT NULL default 'notSeen',
      dispensed boolean NOT NULL default false,
      notified boolean NOT NULL default false,
      redeem boolean NOT NULL default false,
      phone text,
      error text,
      created timestamptz NOT NULL default now(),
      confirmation_time timestamptz
    )`,
    db.defineEnum('cash_out_action_types', actions),
    `CREATE TABLE IF NOT EXISTS cash_out_actions (
      id serial PRIMARY KEY,
      session_id uuid,
      action cash_out_action_types NOT NULL,
      created timestamptz NOT NULL default now()
    )`,
    db.addConstraint('cash_out_actions', 'cash_out_actions_session_id_fkey', 'FOREIGN KEY (session_id) REFERENCES cash_out_txs(session_id)', 'cash_out_txs', 'session_id'),
    db.addColumn('dispenses', 'session_id', 'uuid'),
    db.dropConstraint('dispenses', 'dispenses_transaction_id_fkey')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
