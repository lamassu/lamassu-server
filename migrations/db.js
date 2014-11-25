'use strict';

var pg = require('pg');
var async   = require('async');

// TODO: generalize
var conString = 'psql://lamassu:lamassu@localhost/lamassu';

exports.query = function query(sql, cb) {
  exports.multi([sql], cb);
};

exports.silentQuery = function query(sql, cb) {
  pg.connect(conString, function(err, client, done) {
    if (err) return cb(err);
    client.query(sql, function(err) {
      done(true);
      cb(err);
    });
  });
};

exports.multi = function multi(sqls, cb) {
  pg.connect(conString, function(err, client, done) {
    if (err) return cb(err);

    async.eachSeries(sqls, client.query.bind(client), function(err) {
      done(true);
      if (err) console.log(err);
      cb(err);
    });
  });
};
