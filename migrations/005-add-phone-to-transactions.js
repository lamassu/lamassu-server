'use strict'

var db = require('./db');

exports.up = function(next) {
  db.query('ALTER TABLE transactions ADD COLUMN phone varchar', next);
};

exports.down = function(next) {
  next();
};
