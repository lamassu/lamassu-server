'use strict';

var _trader;
var _lamassuConfig;
var _idVerifier = null;
var logger = require('./logger');
var ApiResponse = require('./api_response');

// Make sure these are higher than polling interval
// or there will be a lot of errors
var STALE_TICKER  = 180000;
var STALE_BALANCE = 180000;

function prepareApi(req, res) {
  return ApiResponse.factory(res);
}

var poll = function(req, res) {
  var rateRec = _trader.rate();
  var balanceRec = _trader.balance;
  var fingerprint = getFingerprint(req);
  var api = prepareApi(req, res);

  logger.debug('poll request from: %s', fingerprint);

  // `rateRec` and `balanceRec` are both objects, so there's no danger
  // of misinterpreting rate or balance === 0 as 'Server initializing'.
  if (!rateRec || !balanceRec) {
    return api.respond('Server initializing');
  }

  var now = Date.now();
  if (now - rateRec.timestamp > STALE_TICKER) {
    return api.respond('Stale ticker');
  }

  if (now - balanceRec.timestamp > STALE_BALANCE) {
    return api.respond('Stale balance');
  }

  var rate = rateRec.rate;
  if (rate === null) return api.respond('No rate available');
  var fiatBalance = _trader.fiatBalance(fingerprint);
  if (fiatBalance === null) return api.respond('No balance available');

  api.respond(null, {
    rate: rate * _trader.config.exchanges.settings.commission,
    fiat: fiatBalance,
    locale: _trader.config.brain.locale,
    txLimit: parseInt(_trader.config.exchanges.settings.compliance.maximum.limit, 10),
    idVerificationLimit: 0  // DEBUG
  });
};

var trade = function (req, res) {
  var fingerprint = getFingerprint(req);
  var api = prepareApi(req, res);
  _trader.trade(req.body, fingerprint);
  api.respond();
};

var deviceEvent = function deviceEvent(req, res) {
  var fingerprint = req.connection.getPeerCertificate().fingerprint;
  var api = prepareApi(req, res);
  _trader.event(req.body, fingerprint);
  api.respond();
};

var idVerify = function idVerify(req, res) {
  // var fingerprint = req.connection.getPeerCertificate().fingerprint;
  var api = prepareApi(req, res);
  _idVerifier.verify(req.body, function (err, idResult) {
    api.respond(err, idResult);
  });
};

var send = function(req, res) {
  var fingerprint = getFingerprint(req);
  var api = prepareApi(req, res);
  _trader.sendBitcoins(fingerprint, req.body, function(err, txHash) {
    api.respond(err, {txHash: txHash});
  });
};

var pair = function(req, res) {
  var api = prepareApi(req, res);
  var token = req.body.token;
  var name = req.body.name;

  _lamassuConfig.pair(
    token,
    getFingerprint(req),
    name,
    function(err) {
      if (err) return api.respond(err, null, 500);
      api.respond();
    }
  );
};

exports.init = function(config) {
  _lamassuConfig = config.lamassuConfig;
  _trader = config.trader;

  var authMiddleware = config.authMiddleware;
  var app = config.app;
  _lamassuConfig.readExchangesConfig(function (err, res) {
    var idVerifyConfig = res.exchanges.plugins.settings.idology;
    idVerifyConfig.mock = config.mock;
    _idVerifier = require('lamassu-idology').factory(idVerifyConfig);
  });

  app.get('/poll', authMiddleware, poll);
  app.post('/send', authMiddleware, send);
  app.post('/trade', authMiddleware, trade);
  app.post('/event', authMiddleware, deviceEvent);
  app.post('/verify_id', authMiddleware, idVerify);
  app.post('/pair', pair);

  return app;
};

function getFingerprint(req) {
  return req.connection.getPeerCertificate && 
    req.connection.getPeerCertificate().fingerprint;
}
