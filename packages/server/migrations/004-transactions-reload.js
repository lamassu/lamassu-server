var db = require('./db')

function singleQuotify (item) { return '\'' + item + '\'' }

exports.up = function (next) {
  var stages = ['initial_request', 'partial_request', 'final_request',
    'partial_send', 'deposit', 'dispense_request', 'dispense']
    .map(singleQuotify).join(',')

  var authorizations = ['timeout', 'machine', 'pending', 'rejected',
    'published', 'authorized', 'confirmed'].map(singleQuotify).join(',')

  var sqls = [
    'CREATE TYPE transaction_stage AS ENUM (' + stages + ')',
    'CREATE TYPE transaction_authority AS ENUM (' + authorizations + ')',

    'CREATE TABLE transactions ( ' +
    'id serial PRIMARY KEY, ' +
    'session_id uuid NOT NULL, ' +
    'device_fingerprint text, ' +
    'to_address text NOT NULL, ' +
    'satoshis integer NOT NULL DEFAULT 0, ' +
    'fiat integer NOT NULL DEFAULT 0, ' +
    'currency_code text NOT NULL, ' +
    'fee integer NOT NULL DEFAULT 0, ' +
    'incoming boolean NOT NULL, ' +
    'stage transaction_stage NOT NULL, ' +
    'authority transaction_authority NOT NULL, ' +
    'tx_hash text, ' +
    'error text, ' +
    'created timestamp NOT NULL DEFAULT now(), ' +
    'UNIQUE (session_id, to_address, stage, authority) ' +
    ')',
    'CREATE INDEX ON transactions (session_id)',

    'CREATE TABLE pending_transactions ( ' +
    'id serial PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'session_id uuid UNIQUE NOT NULL, ' +
    'incoming boolean NOT NULL, ' +
    'currency_code text NOT NULL, ' +
    'to_address text NOT NULL, ' +
    'satoshis integer NOT NULL, ' +
    'updated timestamp NOT NULL DEFAULT now() ' +
    ')',

    'CREATE TABLE dispenses ( ' +
    'id serial PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'transaction_id integer UNIQUE REFERENCES transactions(id), ' +
    'dispense1 integer NOT NULL, ' +
    'reject1 integer NOT NULL, ' +
    'count1 integer NOT NULL, ' +
    'dispense2 integer NOT NULL, ' +
    'reject2 integer NOT NULL, ' +
    'count2 integer NOT NULL, ' +
    'refill boolean NOT NULL, ' +
    'error text, ' +
    'created timestamp NOT NULL DEFAULT now() ' +
    ')',
    'CREATE INDEX ON dispenses (device_fingerprint)'
  ]

  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
