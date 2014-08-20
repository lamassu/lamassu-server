'use strict';

var logger = require('./logger');

var idVerifier = null;
var mock = false;

var plugins;
var config;

module.exports = {
  init: init,
  getFingerprint: getFingerprint
};

// Make sure these are higher than polling interval
// or there will be a lot of errors
var STALE_TICKER  = 180000;
var STALE_BALANCE = 180000;

function poll(req, res) {
  var rateRec = plugins.getDeviceRate();
  var balanceRec = plugins.getBalance();
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

  var rate = rateRec.rates.ask;
  if (rate === null) return res.json({err: 'No rate available'});
  var fiatBalance = plugins.fiatBalance(fingerprint);
  if (fiatBalance === null) return res.json({err: 'No balance available'});

  var idVerificationLimit = _trader.config.exchanges.settings.
    compliance.hasOwnProperty('idVerificationLimit') ?
    _trader.config.exchanges.settings.compliance.idVerificationLimit :
    null;

  res.json({
    err: null,
    rate: rate * config.exchanges.settings.commission,
    fiat: fiatBalance,
    locale: config.brain.locale,
    txLimit: parseInt(config.exchanges.settings.compliance.maximum.limit, 10),
    idVerificationLimit: idVerificationLimit
  });
}

function trade(req, res) {
  var fingerprint = getFingerprint(req);
  plugins.trade(req.body, fingerprint);
  res.json({err: null});
}

function deviceEvent(req, res) {
  var fingerprint = req.connection.getPeerCertificate().fingerprint;
  _trader.event(req.body, fingerprint);
  res.json({err: null});
}

function verifyUser(req, res) {
  if (mock) return res.json({success: true});

  idVerifier.verifyUser(req.body, function (err, idResult) {
    if (err) {
      logger.error(err);
      return res.json({err: 'Verification failed'});
    }
    res.json(idResult);
  });
}

function verifyTransaction(req, res) {
  if (mock) return res.json({success: true});

  idVerifier.verifyTransaction(req.body, function (err, idResult) {
    if (err) {
      logger.error(err);
      return res.json({err: 'Verification failed'});
    }
    res.json(idResult);
  });
}

function send(req, res) {
  var fingerprint = getFingerprint(req);
  plugins.sendBitcoins(fingerprint, req.body, function(err, txHash) {
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

  config.pair(
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

function init(localConfig) {
  config = localConfig.lamassuConfig;
  plugins = localConfig.plugins;
  mock = localConfig.mock;

  var authMiddleware = localConfig.authMiddleware;
  var app = localConfig.app;
  config.readExchangesConfig(function (err, res) {
    var idVerifyConfig = res.exchanges.plugins.settings.identitymind;
    idVerifier = require('lamassu-identitymind');
    idVerifier.init(idVerifyConfig);
  });

  app.get('/poll', authMiddleware, poll);
  app.post('/send', authMiddleware, send);
  app.post('/trade', authMiddleware, trade);
  app.post('/event', authMiddleware, deviceEvent);
  app.post('/verify_user', authMiddleware, verifyUser);
  app.post('/verify_transaction', authMiddleware, verifyTransaction);
  app.post('/pair', pair);

  return app;
}

function getFingerprint(req) {
  return typeof req.connection.getPeerCertificate === 'function' &&
    req.connection.getPeerCertificate().fingerprint;
}
