'use strict';

var _trader;
var _lamassuConfig;
var _idVerifier = null;
var _trader = null;
var logger = require('./logger');

module.exports = {
  init: init,
  getFingerprint: getFingerprint
};

// Make sure these are higher than polling interval
// or there will be a lot of errors
var STALE_TICKER  = 180000;
var STALE_BALANCE = 180000;

function poll(req, res) {
  var rateRec = _trader.rate();
  var balanceRec = _trader.balance;
  var fingerprint = getFingerprint(req);

  logger.debug('poll request from: %s', fingerprint);

  // `rateRec` and `balanceRec` are both objects, so there's no danger
  // of misinterpreting rate or balance === 0 as 'Server initializing'.
  if (!rateRec || !balanceRec) {
    return res.json({err: 'Server initializing'});
  }

  var now = Date.now();
  if (now - rateRec.timestamp > STALE_TICKER) {
    return res.json({err: 'Stale ticker'});
  }

  if (now - balanceRec.timestamp > STALE_BALANCE) {
    return res.json({err: 'Stale balance'});
  }

  var rate = rateRec.rate;
  if (rate === null) return res.json({err: 'No rate available'});
  var fiatBalance = _trader.fiatBalance(fingerprint);
  if (fiatBalance === null) return res.json({err: 'No balance available'});

  res.json({
    err: null,
    rate: rate * _trader.config.exchanges.settings.commission,
    fiat: fiatBalance,
    locale: _trader.config.brain.locale,
    txLimit: parseInt(_trader.config.exchanges.settings.compliance.maximum.limit, 10),
    idVerificationLimit: 0  // DEBUG
  });
}

function trade(req, res) {
  var fingerprint = getFingerprint(req);
  _trader.trade(req.body, fingerprint);

  res.json({err: null});
}

function deviceEvent(req, res) {
  var fingerprint = req.connection.getPeerCertificate().fingerprint;
  _trader.event(req.body, fingerprint);
  res.json({err: null});
}

function idVerify(req, res) {
  // var fingerprint = req.connection.getPeerCertificate().fingerprint;
  _idVerifier.verify(req.body, function (err, idResult) {
    if (err) {
      logger.error(err);
      return res.json({err: 'Verification failed'});
    }
    res.json(idResult);
  });
}

function send(req, res) {
  var fingerprint = getFingerprint(req);
  _trader.sendBitcoins(fingerprint, req.body, function(err, txHash) {
    res.json({
      err: err && err.message,
      txHash: txHash,
      errType: err && err.name
    });
  });
}

function pair(req, res) {
  var token = req.body.token;
  var name = req.body.name;

  _lamassuConfig.pair(
    token,
    getFingerprint(req),
    name,
    function(err) {
      if (err) {
        return res.json(500, { err: err.message });
      }

      res.json(200);
    }
  );
}

function init(config) {
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
}

function getFingerprint(req) {
  return typeof req.connection.getPeerCertificate === 'function' &&
    req.connection.getPeerCertificate().fingerprint;
}
