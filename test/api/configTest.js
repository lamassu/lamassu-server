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

var assert = require('chai').assert;

var LamassuConfig = require('lamassu-config');
var con = 'psql://lamassu:lamassu@localhost/lamassu';
var config = new LamassuConfig(con);

var jsonquest = require('jsonquest');
var express = require('express');
var app = express();
var testPort = 4000;

var cfg;

describe('configurations test', function(){

  beforeEach(function(done) {

    app.listen(testPort);
    config.load(function(err, results) {
      assert.isNull(err);
      assert.ok(results.ok);

      cfg = results.config;

      done();
    });
  });


  it('should get configurations from remote server', function(done) {
    this.timeout(1000000);

    var api = require('../../lib/atm-api');
    api.init(app, cfg);

    // make the request
    setTimeout(function() {
      jsonquest({
        host: 'localhost',
        port: testPort,
        path: '/config',
        method: 'GET',
        protocol: 'http'
      }, function (err, res, body) {
        assert.isNull(err);
        assert.equal(res.statusCode, 200);

        assert.isNull(body.err);
        assert.ok(body.results);

        done();
      });
    }, 2000);
  });
});