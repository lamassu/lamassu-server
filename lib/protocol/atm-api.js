'use strict';

var api = exports.api = require('./api/api');
var _config;
var _lamassuConfig;
var _commission;

// Make sure these are higher than polling interval
// or there will be a lot of errors
var STALE_TICKER  = 180000;
var STALE_BALANCE = 180000;

Error.prototype.toJSON = function () {
  var self = this;
  var ret = {};
  Object.getOwnPropertyNames(self).forEach(function (key) {
    ret[key] = self[key];
  });
  return ret;
};

var poll = function(req, res) {
  if (req.device.unpair) {
    return res.json({
      unpair: true
    });
  }

  var rateRec = api.ticker.rate(req.params.currency);
  var satoshiBalanceRec = api.balance.balance();

  if (rateRec === null || satoshiBalanceRec === null)
    return res.json({err: 'Server initializing'});
  if (Date.now() - rateRec.timestamp > STALE_TICKER)
    return res.json({err: 'Stale ticker'});
  if (Date.now() - rateRec.timestamp > STALE_BALANCE)
    return res.json({err: 'Stale balance'});

  var rate = rateRec.rate;

  res.json({
    err: null,
    rate: rate * _commission,
    fiat: api.fiatBalance(rate, satoshiBalanceRec, 0, 0),
    currency: req.params.currency,
    txLimit: parseInt(_config.exchanges.settings.compliance.maximum.limit, 10)
  });
};

// TODO need to add in a UID for this trade
var trade = function(req, res) {
  api.trade.trade(req.body.fiat, req.body.satoshis, req.body.currency, function(err) {
    res.json({err: err});
  });
};

var send = function(req, res) {
  var fingerprint = req.connection.getPeerCertificate().fingerprint;
  api.send.sendBitcoins(fingerprint, req.body, function(err, txHash) {
    res.json({err: err, txHash: txHash});
  });
};

var configurations = function(req, res) {
  res.json({
    err: _config.exchanges && _config.exchanges.settings ? null : new Error('Settings Not Found!'),
    results: _config.exchanges.settings
  });
};

var pair = function(req, res) {
  var token = req.body.token;
  var name = req.body.name;

  _lamassuConfig.pair(
    token,
    req.connection.getPeerCertificate().fingerprint,
    name,
    function(err) {
      if (err) res.json(500, { err: err.message });
      else res.json(200);
    }
  );
};

exports.init = function(app, config, lamassuConfig, authMiddleware) {
  _config = config;
  _lamassuConfig = lamassuConfig;
  
  api.init(_config.exchanges);

  _commission = _config.exchanges.settings.commission;

  exports._tradeExchange = api._tradeExchange;
  exports._transferExchange = api._transferExchange;

  app.get('/poll/:currency', authMiddleware, poll);
  app.get('/config', authMiddleware, configurations);
  app.post('/trade', authMiddleware, trade);
  app.post('/send', authMiddleware, send);
  app.post('/pair', pair);

  lamassuConfig.on('configUpdate', function () {
    _lamassuConfig.load(function(err, config) {
      if (err) {
        return console.error('Error while reloading config');
      }

      _config = config;
      api.init(_config.exchanges);
      console.log('Config reloaded');
    });
  });

  return app;
};
