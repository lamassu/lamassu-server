'use strict';

var http = require('http');
var https = require('https');
var express = require('express');
var LamassuConfig = require('lamassu-config');
var routes = require('./routes');
var Trader = require('./trader');
var PostgresqlInterface = require('./postgresql_interface');

module.exports = function (options) {
  var app = express();
  var connectionString;
  var server;
  var config;
  var trader;
  var db;

  connectionString = options.postgres ||
                     'postgres://lamassu:lamassu@localhost/lamassu';

  config = new LamassuConfig(connectionString);
  db = new PostgresqlInterface(connectionString);
  trader = new Trader(db);

  config.load(function (err, config) {
    if (err) {
      console.error('Loading config failed');
      throw err;
    }

    trader.configure(config);
    trader.startPolling();
  });

  config.on('configUpdate', function () {
    config.load(function (err, config) {
      if (err) {
        return console.error('Error while reloading config');
      }

      trader.configure(config);
      console.log('Config reloaded');
    });
  });

  app.use(express.bodyParser());

  if (!options.https) {
    server = http.createServer(app);
  }
  else {
    var serverOptions = {
      key: options.https.key,
      cert: options.https.cert,
      requestCert: true,
      secureProtocol: 'TLSv1_method',
      ciphers: 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
      honorCipherOrder: true
    };

    server = https.createServer(serverOptions, app);
  }

  var authMiddleware = function (req, res, next) {
    req.device = {};
    return next();
  };

  if (options.https) {
    authMiddleware = function(req, res, next) {
      var fingerprint = req.connection.getPeerCertificate().fingerprint;

      config.isAuthorized(fingerprint, function (err, device) {
        if (err) { 
          var serverError = new Error('Internal Server Error');
          serverError.status = 500;
          return next(serverError); 
        }
        if (!device) {
          res.statusCode = 404;
          res.json({err: 'Not Found'});
          return next(new Error('Device is unpaired')); 
        }
        next();
      });
    };
  }

  routes.init(app, config, trader, authMiddleware);

  return server;
};
