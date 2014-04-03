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
var argv = require('optimist').argv;
var app = express();
var fs = require('fs');
var LamassuConfig = require('lamassu-config');
var atm = require('lamassu-atm-protocol');

var conString, dbConfig, config;

conString = process.env.DATABASE_URL || 'postgres://lamassu:lamassu@localhost/lamassu';

config = new LamassuConfig(conString);

var port = process.env.PORT || 3000;
app.use(express.logger());
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());

config.load(function(err, conf) {
  if (err) { console.log(err); process.exit(1); }

  var authMiddleware = function (req, res, next) { return next(); };

  if (argv.http) {
    http.createServer(app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (http)');
    });
  }
  else {
    authMiddleware = function(req, res, next) {
      var fingerprint = req.connection.getPeerCertificate().fingerprint;
      var e = new Error('Unauthorized');
      e.status = 401;

      config.isAuthorized(fingerprint, function (err, authorized) {
        if (err) { return next(e); }
        if (!authorized) { return next(e); }
        next();
      });
    };

    var options = {
      key: fs.readFileSync(argv.key),
      cert: fs.readFileSync(argv.cert),
      requestCert: true,
      secureProtocol: 'TLSv1_method',
      ciphers: 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
      honorCipherOrder: true
    };

    https.createServer(options, app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (https)');
    });
  }

  atm.init(app, conf.config, config, authMiddleware);

});
