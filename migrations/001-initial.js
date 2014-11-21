'use strict';

var db = require('./db');

exports.up = function(next) {

  var sqls = [
    'CREATE TABLE IF NOT EXISTS user_config ( ' +
    'id serial PRIMARY KEY, ' +
    'type text NOT NULL, ' +
    'data json NOT NULL ' +
    ')',

    'CREATE TABLE IF NOT EXISTS devices ( ' +
    'id serial PRIMARY KEY, ' +
    'fingerprint text NOT NULL UNIQUE, ' +
    'name text, ' +
    'authorized boolean, ' +
    'unpair boolean NOT NULL DEFAULT false' +
    ')',

    'CREATE TABLE IF NOT EXISTS pairing_tokens (' +
    'id serial PRIMARY KEY, ' +
    'token text, ' +
    'created timestamp NOT NULL DEFAULT now() ' +
    ')',

    'CREATE TABLE IF NOT EXISTS transactions ( ' +
    'id uuid PRIMARY KEY, ' +
    'status text NOT NULL, ' +
    'tx_hash text, ' +
    'device_fingerprint text, ' +
    'to_address text NOT NULL, ' +
    'satoshis integer, ' +
    'currency_code text, ' +
    'fiat decimal, ' +
    'error text, ' +
    'created timestamp NOT NULL DEFAULT now(), ' +
    'completed timestamp ' +
    ')',

    'CREATE TABLE IF NOT EXISTS users ( ' +
    'id serial PRIMARY KEY, ' +
    'userName text NOT NULL UNIQUE, ' +
    'salt text NOT NULL, ' +
    'pwdHash text NOT NULL ' +
    ')'
  ];

  db.multi(sqls, next);
};

exports.down = function(next) {
  next();
};
