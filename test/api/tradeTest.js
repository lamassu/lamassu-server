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
var hock = require('hock');

var LamassuConfig = require('lamassu-config');
var con = 'psql://lamassu:lamassu@localhost/lamassu';
var config = new LamassuConfig(con);

var fnTable = {};
var app = { get: function(route, fn) {
                  fnTable[route] = fn;
                },
            post: function(route, fn) {
                  fnTable[route] = fn;
                }
          };
var cfg;

var bitstampMock = hock.createHock();

/**
 * the tests
 */
describe('trade test', function(){

  beforeEach(function(done) {
    config.load(function(err, result) {
      assert.isNull(err);
      cfg = result;
      done();
    });
  });



  it('should execute a trade against bitstamp', function(done) {
    this.timeout(1000000);

    cfg.exchanges.plugins.trade = 'bitstamp';
    var api = require('../../lib/protocol/atm-api');
    api.init(app, cfg);

    // schedule two trades this should result in a single consolidated trade hitting the trading system
    fnTable['/trade']({body: {fiat: 100, satoshis: 10, currency: 'USD'}}, {json: function(result) {
      console.log(result);
    }});

    fnTable['/trade']({body: {fiat: 100, satoshis: 10, currency: 'USD'}}, {json: function(result) {
      console.log(result);
    }});

    setTimeout(function() { done(); }, 1000000);
    // check results and execute done()
  });
});
