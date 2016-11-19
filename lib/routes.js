'use strict'

const helmet = require('helmet')
const bodyParser = require('body-parser')
const BigNumber = require('bignumber.js')
const logger = require('./logger')
const configManager = require('./config-manager')
const db = require('./db')
const pairing = require('./pairing')

let plugins

module.exports = {
  init,
  getDeviceId
}

const STALE_TICKER = 3 * 60 * 1000
const STALE_BALANCE = 3 * 60 * 1000
const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000

const pids = {}
const reboots = {}

function buildRates (deviceId) {
  const cryptoCodes = plugins.getCryptoCodes()
  const config = plugins.getConfig(deviceId)

  const cashInCommission = new BigNumber(config.commissions.cashInCommission).div(100).plus(1)
  const cashOutCommission = new BigNumber(config.commissions.cashOutCommission).div(100).plus(1)

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

    console.log('DEBUG33.1')

    const locale = {
      currency: config.currencies.fiatCurrency,
      localeInfo: {
        primaryLocale: langs[0],
        primaryLocales: langs
      }
    }

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

    if (response.idVerificationEnabled) {
      response.idVerificationLimit = config.compliance.idVerificationLimit
    }

    res.json(response)
  })
  .catch(e => { console.log(e); logger.error(e) })

  plugins.recordPing(deviceId, deviceTime, req.query)
    .catch(logger.error)
}

function trade (req, res, next) {
  console.log('DEBUG24')
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  plugins.trade(getDeviceId(req), tx)
  .then(() => cacheAndRespond(req, res))
}

function stateChange (req, res) {
  plugins.stateChange(getDeviceId(req), getDeviceTime(req), req.body)
  .then(() => cacheAndRespond(req, res))
}

function send (req, res) {
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.sendCoins(getDeviceId(req), tx)
  .then(status => {
    const body = {txId: status && status.txId}
    return cacheAndRespond(req, res, body)
  })
}

function cashOut (req, res) {
  logger.info({tx: req.body, cmd: 'cashOut'})
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.cashOut(getDeviceId(req), tx)
  .then(cryptoAddress => cacheAndRespond(req, res, {toAddress: cryptoAddress}))
}

function dispenseAck (req, res) {
  plugins.dispenseAck(getDeviceId(req), req.body.tx)
  .then(() => cacheAndRespond(req, res))
}

function deviceEvent (req, res) {
  plugins.logEvent(getDeviceId(req), req.body)
  .then(() => cacheAndRespond(req, res))
}

function verifyUser (req, res) {
  plugins.verifyUser(req.body)
  .then(idResult => cacheAndRespond(req, res, idResult))
}

function verifyTx (req, res) {
  plugins.verifyTransaction(req.body)
  .then(idResult => cacheAndRespond(req, res, idResult))
}

function ca (req, res) {
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
  .then(valid => {
    if (valid) return res.json({ca: pair.ca()})

    return res.status(408).end()
  })
}

function pair (req, res) {
  const token = req.query.token
  const deviceId = getDeviceId(req)

  return pairing.pair(token, deviceId)
  .then(valid => {
    if (valid) return cacheAndRespond(req, res)
    throw httpError('Pairing failed')
  })
}

function phoneCode (req, res) {
  const phone = req.body.phone

  logger.debug('Phone code requested for: ' + phone)

  return plugins.getPhoneCode(phone)
  .then(code => cacheAndRespond(req, res, {code}))
  .catch(err => {
    if (err.name === 'BadNumberError') throw httpError('Bad number', 410)
    throw err
  })
}

function updatePhone (req, res) {
  const notified = req.query.notified === 'true'
  const tx = req.body

  return plugins.updatePhone(tx, notified)
  .then(r => cacheAndRespond(req, res, r))
}

function fetchPhoneTx (req, res) {
  return plugins.fetchPhoneTx(req.query.phone)
  .then(r => res.json(r))
}

function registerRedeem (req, res) {
  const txId = req.params.txId
  return plugins.registerRedeem(txId)
  .then(() => cacheAndRespond(req, res))
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

  return plugins.requestDispense(tx)
  .then(dispenseRec => cacheAndRespond(req, res, dispenseRec))
}

function isUniqueViolation (err) {
  return err.code === '23505'
}

function cacheAction (req, res, next) {
  console.log('DEBUG22: %s', req.path)

  const sql = `insert into idempotents (request_id, device_id, body, status, pending)
  values ($1, $2, $3, $4, $5)`

  const requestId = req.headers['request-id']
  const deviceId = getDeviceId(req)

  db.none(sql, [requestId, deviceId, {}, 204, true])
  .then(() => next())
  .catch(err => {
    if (!isUniqueViolation(err)) throw err

    const sql2 = 'select body, status, pending from idempotents where request_id=$1'
    return db.one(sql2, [requestId])
    .then(row => {
      if (row.pending) return res.status(204).end()
      return res.status(row.status).json(row.body)
    })
  })
}

function updateCachedAction (req, body, status) {
  const sql = `update idempotents set body=$1, status=$2, pending=$3
  where request_id=$4 and device_id=$5 and pending=$6`

  const requestId = req.headers['request-id']
  const deviceId = getDeviceId(req)

  return db.none(sql, [body, status, false, requestId, deviceId, true])
}

function postErrorHandler (err, req, res, next) {
  const statusCode = err.code || 500
  const json = {error: err.message}

  return updateCachedAction(req, json, statusCode)
  .then(() => res.status(statusCode).json({}))
}

function cacheAndRespond (req, res, _body, _status) {
  const status = _status || 200
  const body = _body || {}

  return updateCachedAction(req, body, status)
  .then(() => res.status(status).json(body))
}

function pruneIdempotents () {
  const sql = "delete from idempotents where created < now() - interval '24 hours'"

  return db.none(sql)
}

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
}

function filterOldRequests (req, res, next) {
  const deviceTime = getDeviceTime(req)
  const delta = Date.now() - deviceTime

  if (delta > CLOCK_SKEW) {
    logger.error('Clock skew with lamassu-machine too high [%ss], adjust lamassu-machine clock', (delta / 1000).toFixed(2))
  }

  if (delta > REQUEST_TTL) return res.status(408).end()
  next()
}

function authorize (req, res, next) {
  const deviceId = req.connection.getPeerCertificate().fingerprint
  console.log(deviceId)

  return pair.isPaired(deviceId)
  .then(r => {
    if (r) {
      req.deviceId = deviceId
      return next()
    }

    throw new Error('Unauthorized')
  })
  .catch(e => res.status(403).end())
}

function init (opts) {
  plugins = opts.plugins

  const app = opts.app
  const localApp = opts.localApp

  const authMiddleware = opts.devMode
  ? (req, res, next) => next()
  : authorize

  app.use(helmet())
  app.use(bodyParser.json())
  app.use(filterOldRequests)
  app.post('*', cacheAction)

  app.post('/pair', pair)
  app.get('/ca', ca)

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

  app.post('*', postErrorHandler)

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
      return plugins.configure(config)
      .then(() => logger.info('Config reloaded'))
    })
    .catch(logger.error)
  })

  setInterval(pruneIdempotents, 60000)

  return app
}

function getDeviceTime (req) {
  return Date.parse(req.get('date'))
}

function getDeviceId (req) {
  return (typeof req.connection.getPeerCertificate === 'function' &&
  req.connection.getPeerCertificate().fingerprint) || 'unknown'
}

