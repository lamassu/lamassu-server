'use strict';

var fs = require('fs');
var logger = require('./logger');

var mock = false;

var plugins;
var lamassuConfig;

module.exports = {
  init: init,
  getFingerprint: getFingerprint
};

// Make sure these are higher than polling interval
// or there will be a lot of errors
var STALE_TICKER  = 180000;
var STALE_BALANCE = 180000;

var cartridges = null;
try {
  cartridges = JSON.parse(fs.readFileSync('./cartridges.json'));
} catch(ex) {
  logger.warn('No cartridges.json file found: ' + ex.message);
}

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
  var fiatRate = rateRec.rates.bid || rate;

  if (rate === null) return res.json({err: 'No rate available'});
  if (!fiatRate)
    logger.warn('No bid rate, using ask rate');

  var fiatBalance = plugins.fiatBalance(fingerprint);
  if (fiatBalance === null) return res.json({err: 'No balance available'});

  var config = plugins.getCachedConfig();
  var complianceSettings = config.exchanges.settings.compliance;
  var fiatCommission = config.exchanges.settings.fiatCommission ||
    config.exchanges.settings.commission;
  var response = {
    err: null,
    rate: rate * config.exchanges.settings.commission,
    fiatRate: fiatRate / fiatCommission,
    fiat: fiatBalance,
    locale: config.brain.locale,
    txLimit: parseInt(complianceSettings.maximum.limit, 10),
    dispenseStatus: plugins.dispenseStatus(fingerprint),
    idVerificationEnabled: complianceSettings.idVerificationEnabled,
    cartridges: cartridges
  };

  if (response.idVerificationEnabled)
    response.idVerificationLimit = complianceSettings.idVerificationLimit;

  res.json(response);
}

function trade(req, res) {
  plugins.trade(req.body, getFingerprint(req), function(err, data) {
    var statusCode = data && data.code !== null ? data.code : 201;
    res.json(statusCode, {err: null});
  });
}

function send(req, res) {
  plugins.sendBitcoins(getFingerprint(req), req.body, function(err, status) {
    // TODO: use status.statusCode here after confirming machine compatibility
    res.json({
      errType: err && err.name,
      err: err && err.message,
      txHash: status && status.txHash,
      txId: status && status.txId
    });
  });
}

function cashOut(req, res) {
  logger.info({tx: req.body, cmd: 'cashOut'});
  plugins.cashOut(getFingerprint(req), req.body, function(err, bitcoinAddress) {
    if (err) logger.error(err);

    res.json({
      err: err && err.message,
      errType: err && err.name,
      bitcoinAddress: bitcoinAddress
    });
  });
}

function depositAck(req, res) {
  plugins.depositAck(getFingerprint(req), req.body);
  res.json(200);
}

function deviceEvent(req, res) {
  plugins.logEvent(req.body, getFingerprint(req));
  res.json({err: null});
}

function verifyUser(req, res) {
  if (mock) return res.json({success: true});

  plugins.verifyUser(req.body, function (err, idResult) {
    if (err) {
      logger.error(err);
      return res.json({err: 'Verification failed'});
    }

    res.json(idResult);
  });
}

function verifyTx(req, res) {
  if (mock) return res.json({success: true});

  plugins.verifyTx(req.body, function (err, idResult) {
    if (err) {
      logger.error(err);
      return res.json({err: 'Verification failed'});
    }

    res.json(idResult);
  });
}

function pair(req, res) {
  var token = req.body.token;
  var name = req.body.name;

  lamassuConfig.pair(
    token,
    getFingerprint(req),
    name,
    function(err) {
      if (err) return res.json(500, { err: err.message });

      res.json(200);
    }
  );
}

function init(localConfig) {
  lamassuConfig = localConfig.lamassuConfig;
  plugins = localConfig.plugins;
  mock = localConfig.mock;

  var authMiddleware = localConfig.authMiddleware;
  var app = localConfig.app;

  app.get('/poll', authMiddleware, poll);

  app.post('/trade', authMiddleware, trade);
  app.post('/send', authMiddleware, send);

  app.post('/cash_out', authMiddleware, cashOut);
  app.post('/deposit_ack', authMiddleware, depositAck);

  app.post('/event', authMiddleware, deviceEvent);
  app.post('/verify_user', authMiddleware, verifyUser);
  app.post('/verify_transaction', authMiddleware, verifyTx);
  app.post('/pair', pair);

  return app;
}

function getFingerprint(req) {
  return typeof req.connection.getPeerCertificate === 'function' &&
    req.connection.getPeerCertificate().fingerprint;
}
