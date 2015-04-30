'use strict';

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

function poll(req, res) {
  var rateRec = plugins.getDeviceRate();
  var balanceRec = plugins.getBalance();

  logger.debug('poll request from: %s', getFingerprint(req));

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

  var fiatBalance = plugins.fiatBalance();
  if (fiatBalance === null) {
    logger.warn('No balance available.');
    return res.json({err: 'No balance available'});
  }

  var config = plugins.getConfig();
  var settings = config.exchanges.settings;
  var complianceSettings = settings.compliance;
  var fiatCommission = settings.fiatCommission || settings.commission;

  plugins.pollQueries(session(req), function(err, results) {
    if (err) return logger.error(err);
    var cartridges = results.cartridges;
    var response = {
      err: null,
      rate: rate * settings.commission,
      fiatRate: fiatRate / fiatCommission,
      fiat: fiatBalance,
      locale: config.brain.locale,
      txLimit: parseInt(complianceSettings.maximum.limit, 10),
      idVerificationEnabled: complianceSettings.idVerificationEnabled,
      cartridges: cartridges,
      twoWayMode: cartridges ? true : false,
      zeroConfLimit: settings.zeroConfLimit,
      fiatTxLimit: settings.fiatTxLimit
    };

    if (response.idVerificationEnabled)
      response.idVerificationLimit = complianceSettings.idVerificationLimit;

    res.json(response);
  });
}

function trade(req, res) {
  plugins.trade(session(req), req.body, function(err) {
    var statusCode = err ? 500 : 201;
    res.json(statusCode, {err: err});
  });
}

function send(req, res) {
  plugins.sendBitcoins(session(req), req.body, function(err, status) {
    // TODO: use status.statusCode here after confirming machine compatibility
    // FIX: (joshm) set txHash to status.txId instead of previous status.txHash which wasn't being set
    // Need to clean up txHash vs txId
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
  plugins.cashOut(session(req), req.body, function(err, bitcoinAddress) {
    if (err) logger.error(err);

    res.json({
      err: err && err.message,
      errType: err && err.name,
      bitcoinAddress: bitcoinAddress
    });
  });
}

function dispenseAck(req, res) {
  plugins.dispenseAck(session(req), req.body);
  res.json(200);
}

function deviceEvent(req, res) {
  plugins.logEvent(session(req), req.body);
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

function raqia(req, res) {
  var raqiaCreds;
  try {
    var raqiaRec = require('../raqia.json');
    raqiaCreds = raqiaRec[getFingerprint(req)].apiKeys[0];
  } catch(ex) {
    raqiaCreds = null;
  }
  res.json(raqiaCreds || {});
}

function init(localConfig) {
  lamassuConfig = localConfig.lamassuConfig;
  plugins = localConfig.plugins;
  mock = localConfig.mock;

  var authMiddleware = localConfig.authMiddleware;
  var reloadConfigMiddleware = localConfig.reloadConfigMiddleware;
  var app = localConfig.app;

  app.get('/poll', authMiddleware, reloadConfigMiddleware, poll);

  app.post('/trade', authMiddleware, trade);
  app.post('/send', authMiddleware, send);

  app.post('/cash_out', authMiddleware, cashOut);
  app.post('/dispense_ack', authMiddleware, dispenseAck);

  app.post('/event', authMiddleware, deviceEvent);
  app.post('/verify_user', authMiddleware, verifyUser);
  app.post('/verify_transaction', authMiddleware, verifyTx);
  app.post('/pair', pair);
  app.get('/raqia', raqia);

  return app;
}

function session(req) {
  return {fingerprint: getFingerprint(req), id: req.get('session-id')};
}

function getFingerprint(req) {
  return (typeof req.connection.getPeerCertificate === 'function' &&
    req.connection.getPeerCertificate().fingerprint) || 'unknown';
}
