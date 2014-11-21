'use strict';

var db = require('./db');

exports.up = function(next) {
  db.query('CREATE TABLE bills ( ' +
    'id uuid PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'denomination integer NOT NULL, ' +
    'currency_code text NOT NULL, ' +
    'satoshis integer NOT NULL, ' +
    'to_address text NOT NULL, ' +
    'session_id uuid NOT NULL, ' +
    'device_time bigint NOT NULL, ' +
    'created timestamp NOT NULL DEFAULT now() )', next);
};

exports.down = function(next) {
  next();
};
