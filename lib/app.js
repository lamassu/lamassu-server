#!/usr/bin/env node
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

module.exports = function (options) {
  var connectionString = options.postgres;
  var app = express();
  var server;
  var config;

  connectionString = connectionString ||
                     'postgres://lamassu:lamassu@localhost/lamassu';

  config = new LamassuConfig(connectionString);

  app.use(express.logger());
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

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

    server = https.createServer(options, app);
  }

  config.load(function(err, conf) {
    if (err) { console.log(err); process.exit(1); }

    var authMiddleware = function (req, res, next) { return next(); };

    if (options.https) {
      authMiddleware = function(req, res, next) {
        var fingerprint = req.connection.getPeerCertificate().fingerprint;
        var e = new Error('Unauthorized');
        e.status = 401;

        config.isAuthorized(fingerprint, function (err, device) {
          if (err) { return next(e); }
          if (!device) { return next(e); }
          req.device = device;
          next();
        });
      };
    }

    routes.init(app, conf, config, authMiddleware);
  });

  return server;
};
