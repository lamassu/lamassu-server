/*jshint globalstrict: true, white: false, unused:false */
/*globals require, exports, console, module, process */
/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var http = require('http');
var https = require('https');
var path = require('path');
var express = require('express');
var fs = require('fs');
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

  app.use(express.logger());
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
          var pairError = new Error('Not Found');
          pairError.status = 404;
          return next(pairError); 
        }
        next();
      });
    };
  }

  routes.init(app, config, trader, authMiddleware);

  return server;
};
