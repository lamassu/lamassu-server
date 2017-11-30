'use strict';

var db = require('../lib/migrate-db');

exports.up = function(next) {
  var sql =
    'CREATE TABLE bills ( ' +
    'id uuid PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'denomination integer NOT NULL, ' +
    'currency_code text NOT NULL, ' +
    'satoshis integer NOT NULL, ' +
    'to_address text NOT NULL, ' +
    'session_id uuid NOT NULL, ' +
    'device_time bigint NOT NULL, ' +
    'created timestamp NOT NULL DEFAULT now() )';

  db.silentQuery('ALTER TABLE bills RENAME TO bills_old', function() {
    db.query(sql, next);
  });
};

exports.down = function(next) {
  next();
};
