'use strict'

var db = require('./db')

exports.up = function (next) {
  db.multi(['CREATE TABLE IF NOT EXISTS machine_configs ( ' +
    'id serial PRIMARY KEY, ' +
    'device_fingerprint text NOT NULL, ' +
    'data json NOT NULL )'], next)
}

exports.down = function (next) {
  next()
}
