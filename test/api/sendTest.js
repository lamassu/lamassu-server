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

var async = require('async');
var hock = require('hock');
var createServer = require('../helpers/create-https-server.js');
var assert = require('chai').assert;

var LamassuConfig = require('lamassu-config');
var con = 'psql://lamassu:lamassu@localhost/lamassu';
var config = new LamassuConfig(con);

var fnTable = {};

var app = {
  get: function(route, fn) {
      fnTable[route] = fn;
    },
  post: function(route, fn) {
      fnTable[route] = fn;
    }
};

var cfg;
var port;

var blockchainMock = hock.createHock();

// blockchain info
var guid = '3acf1633-db4d-44a9-9013-b13e85405404';
var pwd = 'baz';
var bitAddr = '1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64';


describe('send test', function() {

  beforeEach(function(done) {

    async.parallel({
      blockchain: async.apply(createServer, blockchainMock.handler),
      config: function(cb) {
        config.load(cb);
      }
    }, function(err, results) {
      assert.isNull(err);

      cfg = results.config;
      port = results.blockchain.address().port;

      cfg.exchanges.plugins.current.transfer = 'blockchain';
      cfg.exchanges.plugins.settings.blockchain = {
        host: 'localhost',
        port: results.blockchain.address().port,
        rejectUnauthorized: false,
        password: pwd,
        fromAddress: bitAddr,
        guid: guid
      };

      done();
    });
  });

  it('should send to blockchain', function(done) {
    this.timeout(1000000);

    var amount= 100000000;

    var address_reponse = {
      'hash160':'660d4ef3a743e3e696ad990364e555c271ad504b',
      'address': bitAddr,
      'n_tx': 1,
      'n_unredeemed': 1,
      'total_received': 0,
      'total_sent': 0,
      'final_balance': 0,
      'txs': []
    };

    var payment_response = {
      'message': 'Sent 0.1 BTC to 1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64',
      'tx_hash': 'f322d01ad784e5deeb25464a5781c3b20971c1863679ca506e702e3e33c18e9c',
      'notice': 'Some funds are pending confirmation and cannot be spent yet (Value 0.001 BTC)'
    };

    blockchainMock
      .get('/address/1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64?format=json&limit=10&password=baz')
      .reply(200, address_reponse)
      .post('/merchant/3acf1633-db4d-44a9-9013-b13e85405404/payment?to=1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64&amount=100000000&from=1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64&password=baz')
      .reply(200, payment_response);


    var api = require('../../lib/protocol/atm-api');
    api.init(app, cfg);

    var params = {
      body: {
        address: bitAddr,
        satoshis: amount
      }
    };

    setTimeout(function() {
      fnTable['/send'](params, {json: function(result) {
          assert.isNull(result.err);
          assert.equal(payment_response.tx_hash, result.results);
          done();
        }
      });
    }, 2000);
  });
});
