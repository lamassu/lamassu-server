'use strict';

var pg = require('pg');
var async   = require('async');
var psqlUrl = require('../lib/options').postgres

exports.query = function query(sql, cb) {
  exports.multi([sql], cb);
};

exports.silentQuery = function query(sql, cb) {
  pg.connect(psqlUrl, function(err, client, done) {
    if (err) {
      console.log(err.message);
      return cb(err);
    }

    client.query(sql, function(err) {
      done(true);
      cb(err);
    });
  });
};

exports.multi = function multi(sqls, cb) {
  pg.connect(psqlUrl, function(err, client, done) {
    if (err) {
      console.log(err.message);
      return cb(err);
    }

    async.eachSeries(sqls, client.query.bind(client), function(err) {
      done(true);
      if (err) console.log(err);
      cb(err);
    });
  });
};
