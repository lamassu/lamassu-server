'use strict'

const morgan = require('morgan')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const BigNumber = require('bignumber.js')
const logger = require('./logger')
const configManager = require('./config-manager')
const db = require('./db')
const dbm = require('./postgresql_interface')
const pairing = require('./pairing')
const settingsLoader = require('./settings-loader')

let plugins

module.exports = {
  init
}

const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000

const pids = {}
const reboots = {}

function poll (req, res, next) {
  const deviceId = req.deviceId
  const deviceTime = req.deviceTime
  const pid = req.query.pid
  const settings = settingsLoader.settings()
  const config = configManager.machineScoped(deviceId, settings.config)

  pids[deviceId] = {pid, ts: Date.now()}

  plugins.pollQueries(deviceTime, deviceId, req.query)
  .then(results => {
    const cartridges = results.cartridges

    const reboot = pid && reboots[deviceId] && reboots[deviceId] === pid
    const langs = config.languages.machineLanguages

    const locale = {
      fiatCode: config.currencies.fiatCurrency,
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
      smsVerificationEnabled: config.compliance.smsVerificationEnabled,
      cartridges,
      twoWayMode: !!cartridges,
      zeroConfLimit: config.commissions.zeroConfLimit,
      fiatTxLimit: config.limits.cashOutTransactionLimit,
      reboot,
      rates: results.rates,
      balances: results.balances,
      coins: config.currencies.cryptoCurrencies
    }

    if (response.idVerificationEnabled) {
      response.idVerificationLimit = config.compliance.idVerificationLimit
    }

    return res.json(response)
  })
  .catch(next)
}

function trade (req, res, next) {
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  plugins.trade(req.deviceId, tx)
  .then(() => cacheAndRespond(req, res))
  .catch(next)
}

function stateChange (req, res, next) {
  plugins.stateChange(req.deviceId, req.deviceTime, req.body)
  .then(() => cacheAndRespond(req, res))
  .catch(next)
}

function send (req, res, next) {
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.sendCoins(req.deviceId, tx)
  .then(status => {
    const body = {txId: status && status.txId}
    return cacheAndRespond(req, res, body)
  })
  .catch(next)
}

function cashOut (req, res, next) {
  logger.info({tx: req.body, cmd: 'cashOut'})
  const tx = req.body
  tx.cryptoAtoms = new BigNumber(tx.cryptoAtoms)

  return plugins.cashOut(req.deviceId, tx)
  .then(cryptoAddress => cacheAndRespond(req, res, {toAddress: cryptoAddress}))
  .catch(next)
}

function dispenseAck (req, res, next) {
  plugins.dispenseAck(req.deviceId, req.body.tx)
  .then(() => cacheAndRespond(req, res))
  .catch(next)
}

function deviceEvent (req, res, next) {
  plugins.logEvent(req.deviceId, req.body)
  .then(() => cacheAndRespond(req, res))
  .catch(next)
}

function verifyUser (req, res, next) {
  plugins.verifyUser(req.body)
  .then(idResult => cacheAndRespond(req, res, idResult))
  .catch(next)
}

function verifyTx (req, res, next) {
  plugins.verifyTransaction(req.body)
  .then(idResult => cacheAndRespond(req, res, idResult))
  .catch(next)
}

function ca (req, res) {
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
  .then(ca => res.json({ca}))
  .catch(() => res.status(408).end())
}

function pair (req, res, next) {
  const token = req.query.token
  const deviceId = req.deviceId

  return pairing.pair(token, deviceId)
  .then(valid => {
    if (valid) return res.end()
    throw httpError('Pairing failed')
  })
  .catch(next)
}

function phoneCode (req, res, next) {
  const phone = req.body.phone

  return plugins.getPhoneCode(phone)
  .then(code => cacheAndRespond(req, res, {code}))
  .catch(err => {
    if (err.name === 'BadNumberError') throw httpError('Bad number', 410)
    throw err
  })
  .catch(next)
}

function updatePhone (req, res, next) {
  const notified = req.query.notified === 'true'
  const tx = req.body

  return dbm.updatePhone(tx, notified)
  .then(r => cacheAndRespond(req, res, r))
  .catch(next)
}

function fetchPhoneTx (req, res, next) {
  return plugins.fetchPhoneTx(req.query.phone)
  .then(r => res.json(r))
  .catch(next)
}

function registerRedeem (req, res, next) {
  const txId = req.params.txId
  return dbm.registerRedeem(txId)
  .then(() => cacheAndRespond(req, res))
  .catch(next)
}

function waitForDispense (req, res, next) {
  logger.debug('waitForDispense')
  return dbm.fetchTx(req.params.txId)
  .then(tx => {
    logger.debug('tx fetched')
    logger.debug(tx)
    if (!tx) return res.sendStatus(404)
    if (tx.status === req.query.status) return res.sendStatus(304)
    res.json({tx})
  })
  .catch(next)
}

function dispense (req, res, next) {
  const tx = req.body.tx

  return dbm.addDispenseRequest(tx)
  .then(dispenseRec => cacheAndRespond(req, res, dispenseRec))
  .catch(next)
}

function isUniqueViolation (err) {
  return err.code === '23505'
}

function cacheAction (req, res, next) {
  const requestId = req.headers['request-id']
  if (!requestId) return next()

  const sql = `insert into idempotents (request_id, device_id, body, status, pending)
  values ($1, $2, $3, $4, $5)`

  const deviceId = req.deviceId

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
  const requestId = req.headers['request-id']
  if (!requestId) return Promise.resolve()

  const sql = `update idempotents set body=$1, status=$2, pending=$3
  where request_id=$4 and device_id=$5 and pending=$6`

  const deviceId = req.deviceId

  return db.none(sql, [body, status, false, requestId, deviceId, true])
}

function errorHandler (err, req, res, next) {
  const statusCode = err.name === 'HttpError'
  ? err.code || 500
  : 500

  const json = {error: err.message}

  logger.error(err)

  return updateCachedAction(req, json, statusCode)
  .then(() => res.status(statusCode).json(json))
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
  const deviceTime = req.deviceTime
  const delta = Date.now() - deviceTime

  if (delta > CLOCK_SKEW) {
    logger.error('Clock skew with lamassu-machine too high [%ss], adjust lamassu-machine clock', (delta / 1000).toFixed(2))
  }

  if (delta > REQUEST_TTL) return res.status(408).end()
  next()
}

function authorize (req, res, next) {
  const deviceId = req.deviceId

  return pairing.isPaired(deviceId)
  .then(r => {
    if (r) {
      req.deviceId = deviceId
      return next()
    }

    throw httpError('Unauthorized', 403)
  })
  .catch(next)
}

function init (opts) {
  plugins = opts.plugins

  const app = opts.app
  const localApp = opts.localApp

  const authMiddleware = opts.devMode
  ? (req, res, next) => next()
  : authorize

  app.use(morgan('dev'))
  app.use(helmet())
  app.use(populateDeviceId)
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

  app.use('*', errorHandler)

  localApp.get('/pid', (req, res) => {
    const deviceId = req.query.device_id
    const pidRec = pids[deviceId]
    res.json(pidRec)
  })

  localApp.post('/reboot', (req, res) => {
    const pid = req.body.pid
    const deviceId = req.body.deviceId

    if (!deviceId || !pid) {
      return res.sendStatus(400)
    }

    reboots[deviceId] = pid
    res.sendStatus(200)
  })

  localApp.post('/dbChange', (req, res, next) => {
    return settingsLoader.load()
    .then(() => logger.info('Config reloaded'))
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
  })

  setInterval(pruneIdempotents, 60000)

  return app
}

function populateDeviceId (req, res, next) {
  const deviceId = ((typeof req.connection.getPeerCertificate === 'function' &&
  req.connection.getPeerCertificate().fingerprint)) || null

  req.deviceId = deviceId
  req.deviceTime = Date.parse(req.get('date'))

  next()
}
