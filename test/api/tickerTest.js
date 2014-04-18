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

var hock = require('hock');
var async = require('async');
var createServer = require('../helpers/create-https-server.js');
var assert = require('chai').assert;

var LamassuConfig = require('lamassu-config');
var con = 'psql://lamassu:lamassu@localhost/lamassu';
var config = new LamassuConfig(con);

var cfg;

var blockchainMock = hock.createHock();
var bitpayMock = hock.createHock();

var jsonquest = require('jsonquest');
var express = require('express');
var app = express();
var testPort = 4000;



describe('ticker test', function(){

  beforeEach(function(done) {

    app.listen(testPort);

    async.parallel({
      blockchain: async.apply(createServer, blockchainMock.handler),
      bitpay: async.apply(createServer, bitpayMock.handler),
      config: config.load.bind(config)
    }, function(err, results) {
      assert.isNull(err);

      cfg = results.config;

      cfg.exchanges.settings.commission = 1;

      cfg.exchanges.plugins.current.ticker = 'bitpay';
      cfg.exchanges.plugins.current.trade = null;
      cfg.exchanges.plugins.settings.bitpay = {
        host: 'localhost',
        port: results.bitpay.address().port,
        rejectUnauthorized: false
      };

      cfg.exchanges.plugins.current.transfer = 'blockchain';
      cfg.exchanges.plugins.settings.blockchain = {
        host: 'localhost',
        port: results.blockchain.address().port,
        rejectUnauthorized: false,
        password: 'baz',
        fromAddress: '1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64',
        guid: '3acf1633-db4d-44a9-9013-b13e85405404'
      };

      done();
    });
  });


  it('should read ticker data from bitpay', function(done) {
    this.timeout(1000000);

    bitpayMock
      .get('/api/rates')
      .reply(200, [
        { code: 'EUR', rate: 1337 },
        { code: 'USD', rate: 100 }
      ]);

    blockchainMock
      .get('/merchant/3acf1633-db4d-44a9-9013-b13e85405404/address_balance?address=1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64&confirmations=0&password=baz')
      .reply(200, { balance: 100000000, total_received: 100000000 })
      .get('/merchant/3acf1633-db4d-44a9-9013-b13e85405404/address_balance?address=1LhkU2R8nJaU8Zj6jB8VjWrMpvVKGqCZ64&confirmations=1&password=baz')
      .reply(200, { balance: 100000000, total_received: 100000000 });
    // That's 1 BTC.

    var api = require('../../lib/protocol/atm-api');
    api.init(app, cfg);

    // let ticker rate fetch finish...
    setTimeout(function() {
      jsonquest({
        host: 'localhost',
        port: testPort,
        path: '/poll/USD',//:currency
        method: 'GET',
        protocol: 'http'
      }, function (err, res, body) {
        assert.isNull(err);
        assert.equal(res.statusCode, 200);

        assert.isNull(body.err);
        assert.equal(Number(body.rate) > 0, true);
        console.log(100 / cfg.exchanges.settings.lowBalanceMargin, body.fiat);
        assert.equal(body.fiat, 100 / cfg.exchanges.settings.lowBalanceMargin);

        done();
      });
    }, 2000);
  });
});
