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
var argv = require('optimist').argv;
var LamassuConfig = require('lamassu-config');
var atm = require('lamassu-atm-protocol');
var format = require('util').format;

var conString, dbConfig, config;

if (process.env.DATABASE_URL) {
  conString = process.env.DATABASE_URL;
}
else {
  dbConfig = require('../config/postgres.json');
  conString = format('postgres://%s:%s@%s/%s', dbConfig.user, dbConfig.pwd, dbConfig.host, dbConfig.db);
}

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
  atm.init(app, conf.config);

  if (argv.https) {
    var testkeys = path.join(__dirname, '..', 'testkeys');
    var privateKey = fs.readFileSync(path.join(testkeys, 'privatekey.pem'));
    var certificate = fs.readFileSync(path.join(testkeys, 'certificate.pem'));
    var credentials = {key: privateKey, cert: certificate};
    https.createServer(credentials, app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (https)');
    });
  }
  else {
    http.createServer(app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (http)');
    });
  }
});
