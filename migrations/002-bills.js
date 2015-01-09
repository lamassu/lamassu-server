'use strict';

var db = require('./db');

exports.up = function(next) {
  var sqls = [
    'CREATE TABLE IF NOT EXISTS bills ( ' +
    'id uuid PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'denomination integer NOT NULL, ' +
    'currency_code text NOT NULL, ' +
    'satoshis integer NOT NULL, ' +
    'to_address text NOT NULL, ' +
    'transaction_id uuid NOT NULL, ' +
    'device_time bigint NOT NULL, ' +
    'created timestamp NOT NULL DEFAULT now() )',

    'ALTER TABLE bills RENAME COLUMN transaction_id TO session_id'
  ];

  db.multi(sqls, next);
};

exports.down = function(next) {
  next();
};
