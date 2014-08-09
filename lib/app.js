'use strict';

var http = require('http');
var https = require('https');
var express = require('express');
var LamassuConfig = require('lamassu-config');
var routes = require('./routes');
var Trader = require('./trader');
var PostgresqlInterface = require('./postgresql_interface');
var logger = require('./logger');

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
      logger.error('Loading config failed');
      throw err;
    }

    trader.configure(config);
    trader.startPolling();
  });

  config.on('configUpdate', function () {
    config.load(function (err, config) {
      if (err) {
        return logger.error('Error while reloading config');
      }

      trader.configure(config);
      logger.info('Config reloaded');
    });
  });

  app.use(express.bodyParser());

  var authMiddleware;

  if (options.https) {
    var serverOptions = {
      key: options.https.key,
      cert: options.https.cert,
      requestCert: true,
      secureProtocol: 'TLSv1_method',
      ciphers: 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
      honorCipherOrder: true
    };

    server = https.createServer(serverOptions, app);

    authMiddleware = function(req, res, next) {
      config.isAuthorized(routes.getFingerprint(req), function (err, device) {
        if (err) {
          res.json({err: 'Internal Server Error'});
          return next(err);
        }
        if (!device) {
          res.json(404, {err: 'Not Found'});
          return next(new Error('Device is unpaired'));
        }
        next();
      });
    };

  } else {
    server = http.createServer(app);

    authMiddleware = function (req, res, next) {
      req.device = {};
      return next();
    };
  }

  if (options.mock) logger.info('In mock mode');

  routes.init({
    app: app,
    lamassuConfig: config,
    trader: trader,
    authMiddleware: authMiddleware,
    mock: options.mock
  });

  return server;
};
