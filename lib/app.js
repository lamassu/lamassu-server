/*jshint globalstrict: true, es5:true, white: false, unused:false */
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

var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var argv = require('optimist').argv;
var config = require('lamassu-config');
var atm = require('lamassu-atm-protocol');

var privateKey = fs.readFileSync('../testkeys/privatekey.pem').toString();
var certificate = fs.readFileSync('../testkeys/certificate.pem').toString();
var credentials = {key: privateKey, cert: certificate};

app.set('port', argv.port || 3000);
app.use(express.logger());
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());

/*
if (app.get('env') === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}
else {
  app.use(express.static(path.join(__dirname, '../.tmp')));
  app.use(express.static(path.join(__dirname, '../app')));
  app.use(express.errorHandler());
}
*/

config.load(function(err, conf) {
  if (err) { console.log(err); process.exit(1); }
  atm.init(app, conf.config);

  https.createServer(credentials, app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
});

