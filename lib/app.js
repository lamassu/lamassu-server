'use strict';

var http = require('http');
var https = require('https');
var express = require('express');
var LamassuConfig = require('lamassu-config');
var routes = require('./routes');
var plugins = require('./plugins');
var PostgresqlInterface = require('./postgresql_interface');
var logger = require('./logger');

module.exports = function (options) {
  var app = express();
  var connectionString;
  var server;
  var lamassuConfig;
  var db;

  connectionString = options.postgres ||
                     'postgres://lamassu:lamassu@localhost/lamassu';

  lamassuConfig = new LamassuConfig(connectionString);
  db = new PostgresqlInterface(connectionString);
  plugins.init(db);


  lamassuConfig.load(function (err, config) {
    if (err) {
      logger.error('Loading config failed');
      throw err;
    }

    plugins.configure(config);
    plugins.startPolling();
  });

  lamassuConfig.on('configUpdate', function () {
    lamassuConfig.load(function (err, config) {
      if (err) {
        return logger.error('Error while reloading config');
      }

      plugins.configure(config);
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
      lamassuConfig.isAuthorized(routes.getFingerprint(req), function (err, device) {
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
    lamassuConfig: lamassuConfig,
    plugins: plugins,
    authMiddleware: authMiddleware,
    mock: options.mock
  });

  return server;
};
