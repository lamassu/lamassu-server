// /*global describe, it */
// 'use strict';

// var assert = require('chai').assert;
// var Trader = require('../../lib/trader.js');
// var PostgresqlInterface = require('../../lib/postgresql_interface.js');

// var db = 'psql://lamassu:lamassu@localhost/lamassu-test';
// var psqlInterface = new PostgresqlInterface(db);

// var CURRENCY = 'USD';

// describe('trader/send', function () {
//   var trader = new Trader(psqlInterface);
//   trader.config = {
//     exchanges: {
//       settings: { currency: CURRENCY }
//     }
//   };

//   it('should call `balance` on the transfer exchange', function (done) {
//     trader.transferExchange = {
//       balance: function (callback) {
//         callback(null, 100);
//       }
//     };

//     trader.pollBalance(function (err) {
//       assert.notOk(err);
//       assert.equal(trader.balance.transferBalance, 100);
//       assert.ok(trader.balance.timestamp);
//       done();
//     });
//   });

//   it('should call `ticker` on the ticker exchange', function (done) {
//     trader.tickerExchange = {
//       ticker: function (currencies, callback) {
//         assert.equal(currencies[0], CURRENCY);
//         callback(null, {USD: {rate: 100}});
//       }
//     };

//     trader.pollRate(function (err) {
//       assert.notOk(err);
//       var rate = trader.rate(CURRENCY);
//       assert.equal(rate.rate, 100);
//       assert.ok(rate.timestamp);
//       done();
//     });
//   });
// });
