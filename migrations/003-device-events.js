'use strict';

var db = require('./db');

exports.up = function(next) {
  db.query('CREATE TABLE machine_events ( ' +
    'id uuid PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'event_type text NOT NULL, ' +
    'note text, ' +
    'device_time bigint NOT NULL, ' +
    'created timestamp NOT NULL DEFAULT now() )', next);
};

exports.down = function(next) {
  next();
};
