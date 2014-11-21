'use strict';

var db = require('./db');

function singleQuotify(item) { return '\'' + item + '\''; }

exports.up = function(next) {
  var stages = ['initial_request', 'partial_request', 'final_request',
    'partial_send', 'deposit', 'dispense_request', 'dispense'].
    map(singleQuotify).join(',');
  var sources = ['timeout', 'machine', 'pending', 'published',
    'authorized', 'rejected'].map(singleQuotify).join(',');
  var sqls = [
    'CREATE TYPE transaction_stage AS ENUM (' + stages + ')',
    'CREATE TYPE transaction_source AS ENUM (' + sources + ')',
    'ALTER TABLE transactions DROP IF EXISTS completed',
    'ALTER TABLE transactions DROP CONSTRAINT transactions_pkey',
    'ALTER TABLE transactions RENAME id TO session_id',
    'ALTER TABLE transactions ADD COLUMN id SERIAL',
    'UPDATE transactions SET id = DEFAULT',
    'ALTER TABLE transactions ADD PRIMARY KEY (id)',
    'CREATE INDEX ON transactions (session_id)',
    'ALTER TABLE transactions ADD COLUMN incoming boolean DEFAULT false',
    'ALTER TABLE transactions ADD COLUMN stage transaction_stage NULL',
    'ALTER TABLE transactions ADD COLUMN source transaction_source NULL',
    'ALTER TABLE transactions ADD COLUMN fee integer NOT NULL DEFAULT 0',
    'ALTER TABLE transactions ADD COLUMN error text NULL',
    'ALTER TABLE transactions ALTER COLUMN fiat SET DEFAULT 0',
    'ALTER TABLE transactions ALTER COLUMN satoshis SET DEFAULT 0',
    'ALTER TABLE transactions ALTER COLUMN fiat SET NOT NULL',
    'ALTER TABLE transactions ALTER COLUMN satoshis SET NOT NULL',
    'ALTER TABLE transactions ADD CONSTRAINT transactions_unique_source ' +
      'UNIQUE (session_id,to_address,stage,source)',

    'ALTER TABLE transactions DROP COLUMN status',
    // Convert stages, source to NOT NULL

    'CREATE TABLE pending_transactions ( ' +
    'id serial PRIMARY KEY, ' +
    'session_id uuid UNIQUE NOT NULL, ' +
    'incoming boolean NOT NULL, ' +
    'currency_code text NOT NULL, ' +
    'to_address text NOT NULL, ' +
    'created timestamp NOT NULL DEFAULT now() ' +
    ')',

    'CREATE TABLE dispenses ( ' +
    'id serial PRIMARY KEY, ' +
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
    ')'
  ];
  db.multi(sqls, next);
};

exports.down = function(next) {
  next();
};
