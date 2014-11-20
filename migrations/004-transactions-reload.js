'use strict';

var db = require('./db');

exports.up = function(next){
  var sqls = [
    'ALTER TABLE transactions DROP IF EXISTS completed',
    'ALTER TABLE transactions DROP CONSTRAINT transactions_pkey',
    'ALTER TABLE transactions RENAME id TO session_id',
    'ALTER TABLE transactions ADD COLUMN id SERIAL',
    'UPDATE transactions SET id = DEFAULT',
    'ALTER TABLE transactions ADD PRIMARY KEY (id)',
    'CREATE INDEX ON transactions (session_id)',
    'ALTER TABLE transactions ADD CONSTRAINT transactions_session_status UNIQUE (session_id,status)',
    'ALTER TABLE transactions ADD COLUMN incoming boolean',

    'CREATE TABLE digital_transactions ( ' +
    'id serial PRIMARY KEY, ' +
    'transaction_id integer REFERENCES transactions(id), ' +
    'status text, ' +
    'incoming boolean, ' +
    'tx_hash text NULL, ' +
    'error text NULL, ' +
    'created timestamp NOT NULL DEFAULT now(), ' +
    'CONSTRAINT digital_transactions_status_txid UNIQUE (status, transaction_id) ' +
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
    'error text NULL, ' +
    'created timestamp NOT NULL DEFAULT now() ' +
    ')'
  ];
  db.multi(sqls, next);
};

exports.down = function(next){
  next();
};
