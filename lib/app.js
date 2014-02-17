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

var path = require('path');
var express = require('express');
var argv = require('optimist').argv;
var app = express();
var fs = require('fs');
var argv = require('optimist').argv;
var config = require('lamassu-config');
var atm = require('lamassu-atm-protocol');
var mode;
var localDb = 'postgres://postgres:password@localhost/lamassu';
var herokuDb = 'postgres://txkholoodiceqt:9WPMKrlitFf7GseoZiSj5Xcdbt@ec2-54-197-237-120.compute-1.amazonaws.com/d40d97tmgr3829';
var conString;


var port = process.env.PORT || 3000;
app.use(express.logger());
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());

if (argv.https) {
  mode = 'local';
  conString = localDb;
}
else {
  mode = 'heroku';
  conString = herokuDb;
}

config.load(conString, function(err, conf) {
  if (err) { console.log(err); process.exit(1); }
  atm.init(app, conf.config, mode);

  if (argv.https) {
    var https = require('https');
    var testkeys = path.join(__dirname, '..', 'testkeys');
    var privateKey = fs.readFileSync(path.join(testkeys, 'privatekey.pem'));
    var certificate = fs.readFileSync(path.join(testkeys, 'certificate.pem'));
    var credentials = {key: privateKey, cert: certificate};
    https.createServer(credentials, app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (https)');
    });
  }
  else {
    var http = require('http');
    http.createServer(app).listen(port, function () {
      console.log('Express server listening on port ' + port + ' (http)');
    });
  }
});


