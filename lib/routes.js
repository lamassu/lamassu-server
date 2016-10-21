'use strict'

const BigNumber = require('bignumber.js')
const logger = require('./logger')
const configManager = require('./config-manager')

let mock = false

let plugins

module.exports = {
  init,
  getDeviceId
}

const STALE_TICKER = 3 * 60 * 1000
const STALE_BALANCE = 3 * 60 * 1000

const pids = {}
const reboots = {}

function buildRates (deviceId) {
  const cryptoCodes = plugins.getCryptoCodes()
  const config = plugins.getConfig(deviceId)

  const cashInCommission = new BigNumber(config.commissions.cashInCommission).div(100)
  const cashOutCommission = new BigNumber(config.commissions.cashOutCommission).div(100)

  const rates = {}
  cryptoCodes.forEach(cryptoCode => {
    const _rate = plugins.getDeviceRate(cryptoCode)
    if (!_rate) return logger.warn('No rate for ' + cryptoCode + ' yet')
    if (Date.now() - _rate.timestamp > STALE_TICKER) return logger.warn('Stale rate for ' + cryptoCode)
    const rate = _rate.rates
    rates[cryptoCode] = {
      cashIn: rate.ask.times(cashInCommission),
      cashOut: rate.bid.div(cashOutCommission)
    }
  })

  return rates
}

function buildBalances (deviceId) {
  const cryptoCodes = plugins.getCryptoCodes(deviceId)

  const _balances = {}
  cryptoCodes.forEach(cryptoCode => {
    const balanceRec = plugins.fiatBalance(cryptoCode, deviceId)
    if (!balanceRec) return logger.warn('No balance for ' + cryptoCode + ' yet')
    if (Date.now() - balanceRec.timestamp > STALE_BALANCE) return logger.warn('Stale balance for ' + cryptoCode)
    _balances[cryptoCode] = balanceRec.balance
  })

  return _balances
}

function poll (req, res) {
  console.log('DEBUG1')
  const deviceId = getDeviceId(req)
  const deviceTime = getDeviceTime(req)
  const pid = req.query.pid

  pids[deviceId] = {pid, ts: Date.now()}

  logger.debug('poll request from: %s', deviceId)

  let rates = {}
  let balances = {}

  rates = buildRates(deviceId)
  balances = buildBalances(deviceId)

  const config = plugins.getConfig(deviceId)

  console.log('DEBUG30')

  plugins.pollQueries(deviceId)
  .then(results => {
    console.log('DEBUG31')

    const cartridges = results.cartridges

    const reboot = pid && reboots[deviceId] && reboots[deviceId] === pid
    console.log('DEBUG2: %j, %s, %s', reboots, reboot, pid)
    const langs = config.languages.machineLanguages

    console.log('DEBUG33')

    const locale = {
      currency: config.currencies.fiatCurrency,
      localeInfo: {
        primaryLocale: langs[0],
        primaryLocales: langs
      }
    }

    console.log('DEBUG34')

    const response = {
      err: null,
      locale,
      txLimit: config.limits.cashInTransactionLimit,
      idVerificationEnabled: config.compliance.idVerificationEnabled,
      cartridges,
      twoWayMode: !!cartridges,
      zeroConfLimit: config.commissions.zeroConfLimit,
      fiatTxLimit: config.limits.cashOutTransactionLimit,
      reboot,
      rates,
      balances,
      coins: config.currencies.cryptos
    }

    console.log('DEBUG35')

    if (response.idVerificationEnabled) {
      response.idVerificationLimit = config.compliance.idVerificationLimit
    }

    console.log('DEBUG32')

    res.json(response)
  })
  .catch(e => { console.log(e); logger.error(e) })

  plugins.recordPing(deviceId, deviceTime, req.query)
    .catch(logger.error)
}

function trade (req, res) {
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  plugins.trade(getDeviceId(req), tx)
    .then(() => res.status(201).json({}))
    .catch(err => {
      logger.error(err)
      res.status(500).json({err})
    })
}

function stateChange (req, res) {
  plugins.stateChange(getDeviceId(req), getDeviceTime(req), req.body)
    .then(() => res.json({success: true}))
    .catch(err => {
      console.error(err)
      res.json({success: false})
    })
}

function send (req, res) {
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.sendCoins(getDeviceId(req), tx)
    .then(status => {
      res.json({
        txHash: status && status.txHash,
        txId: status && status.txId
      })
    })
    .catch(err => {
      console.log('DEBUG15: %s', err)
      logger.error(err)
      res.json({
        err: err.message,
        errType: err.name
      })
    })
}

function cashOut (req, res) {
  logger.info({tx: req.body, cmd: 'cashOut'})
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.cashOut(getDeviceId(req), tx)
  .then(cryptoAddress => res.json({toAddress: cryptoAddress}))
  .catch(err => {
    res.json({
      err: err.message,
      errType: err.name
    })
    logger.error(err)
  })
}

function dispenseAck (req, res) {
  plugins.dispenseAck(getDeviceId(req), req.body.tx)
  res.json({success: true})
}

function deviceEvent (req, res) {
  plugins.logEvent(getDeviceId(req), req.body)
  res.json({err: null})
}

function verifyUser (req, res) {
  if (mock) return res.json({success: true})

  plugins.verifyUser(req.body, (err, idResult) => {
    if (err) {
      logger.error(err)
      return res.json({err: 'Verification failed'})
    }

    res.json(idResult)
  })
}

function verifyTx (req, res) {
  if (mock) return res.json({success: true})

  plugins.verifyTx(req.body, (err, idResult) => {
    if (err) {
      logger.error(err)
      return res.json({err: 'Verification failed'})
    }

    res.json(idResult)
  })
}

function ca (req, res) {
  const token = req.body.token

  return pair.authorizeCaDownload(token)
  .then(valid => {
    if (valid) return res.json({ca: pair.ca()})

    return res.status(408).end()
  })
}

function pair (req, res) {
  const token = req.body.token
  const deviceId = getDeviceId(req)

  return pair.pair(token, deviceId)
  .then(valid => {
    if (valid) return res.status(200).end()
    return res.status(408).end()
  })
}

function phoneCode (req, res) {
  const phone = req.body.phone

  logger.debug('Phone code requested for: ' + phone)
  return plugins.getPhoneCode(phone)
    .then(code => res.json({code}))
    .catch(err => {
      logger.error(err)
      if (err.name === 'BadNumberError') return res.sendStatus(410)
      return res.sendStatus(500)
    })
}

function updatePhone (req, res) {
  const notified = req.query.notified === 'true'
  const tx = req.body

  return plugins.updatePhone(tx, notified)
    .then(r => res.json(r))
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
}

function fetchPhoneTx (req, res) {
  return plugins.fetchPhoneTx(req.query.phone)
    .then(r => res.json(r))
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
}

function registerRedeem (req, res) {
  const txId = req.params.txId
  return plugins.registerRedeem(txId)
    .then(() => res.json({success: true}))
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
}

function waitForDispense (req, res) {
  logger.debug('waitForDispense')
  return plugins.fetchTx(req.params.txId)
    .then(tx => {
      logger.debug('tx fetched')
      logger.debug(tx)
      if (!tx) return res.sendStatus(404)
      if (tx.status === req.query.status) return res.sendStatus(304)
      res.json({tx})
    })
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
}

function dispense (req, res) {
  const tx = req.body.tx
  const txId = tx.id
  const deviceId = getDeviceId(req)

  console.log('DEBUG17')

  return cachedResponse(deviceId, txId, req)
  .then(cached => {
    console.log('DEBUG18: %j', cached)

    // Cache hit
    if (cached && cached.pendingRequest) return res.sendStatus(409)
    console.log('DEBUG18.5')
    if (cached) res.json(cached)

    console.log('DEBUG19')

    // No cache hit
    return plugins.requestDispense(tx)
    .then(dispenseRec => {
      console.log('DEBUG20: %j', dispenseRec)

      return cacheResponse(deviceId, txId, req, dispenseRec)
      .then(() => res.json(dispenseRec))
    })
    .catch(err => {
      console.log('DEBUG21')

      logger.error(err)
      res.sendStatus(500)
    })
  })
  .catch(err => logger.error(err))
}

function init (opts) {
  plugins = opts.plugins
  mock = opts.mock

  const authMiddleware = opts.authMiddleware
  const app = opts.app
  const localApp = opts.localApp

  app.post('/pair', pair)
  app.post('/ca', ca)

  app.get('/poll', authMiddleware, poll)

  app.post('/trade', authMiddleware, trade)
  app.post('/send', authMiddleware, send)
  app.post('/state', authMiddleware, stateChange)
  app.post('/cash_out', authMiddleware, cashOut)
  app.post('/dispense_ack', authMiddleware, dispenseAck)

  app.post('/event', authMiddleware, deviceEvent)
  app.post('/verify_user', authMiddleware, verifyUser)
  app.post('/verify_transaction', authMiddleware, verifyTx)

  app.post('/phone_code', authMiddleware, phoneCode)
  app.post('/update_phone', authMiddleware, updatePhone)
  app.get('/phone_tx', authMiddleware, fetchPhoneTx)
  app.post('/register_redeem/:txId', authMiddleware, registerRedeem)
  app.get('/await_dispense/:txId', authMiddleware, waitForDispense)
  app.post('/dispense', authMiddleware, dispense)

  localApp.get('/pid', (req, res) => {
    const deviceId = req.query.device_id
    const pidRec = pids[deviceId]
    res.json(pidRec)
  })

  localApp.post('/reboot', (req, res) => {
    const pid = req.body.pid
    const deviceId = req.body.deviceId
    console.log('pid: %s, deviceId: %s', pid, deviceId)

    if (!deviceId || !pid) {
      return res.sendStatus(400)
    }

    reboots[deviceId] = pid
    res.sendStatus(200)
  })

  localApp.post('/dbChange', (req, res) => {
    return configManager.load()
    .then(config => {
      plugins.configure(config)
      logger.info('Config reloaded')
    })
    .catch(logger.error)
  })

  return app
}

function getDeviceTime (req) {
  return Date.parse(req.get('date'))
}

function getDeviceId (req) {
  return (typeof req.connection.getPeerCertificate === 'function' &&
  req.connection.getPeerCertificate().fingerprint) || 'unknown'
}

function cachedResponse (deviceId, txId, req) {
  return plugins.cachedResponse(deviceId, txId, req.path, req.method)
  .then(r => r.body)
}

function cacheResponse (deviceId, txId, req, body) {
  return plugins.cacheResponse(deviceId, txId, req.path, req.method, body)
}
