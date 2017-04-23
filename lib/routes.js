'use strict'

const morgan = require('morgan')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const _ = require('lodash/fp')
const express = require('express')

const options = require('./options')
const logger = require('./logger')
const configManager = require('./config-manager')
const pairing = require('./pairing')
const settingsLoader = require('./settings-loader')
const plugins = require('./plugins')
const helpers = require('./route-helpers')
const poller = require('./poller')
const Tx = require('./tx')

const argv = require('minimist')(process.argv.slice(2))

const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000

const pids = {}
const reboots = {}

const devMode = argv.dev || options.http

function poll (req, res, next) {
  const deviceId = req.deviceId
  const deviceTime = req.deviceTime
  const pid = req.query.pid
  const settings = req.settings
  const config = configManager.machineScoped(deviceId, settings.config)
  const pi = plugins(settings, deviceId)

  pids[deviceId] = {pid, ts: Date.now()}

  return pi.pollQueries(deviceTime, req.query)
  .then(results => {
    const cartridges = results.cartridges

    const reboot = pid && reboots[deviceId] && reboots[deviceId] === pid
    const langs = config.machineLanguages

    const locale = {
      fiatCode: config.fiatCurrency,
      localeInfo: {
        primaryLocale: langs[0],
        primaryLocales: langs,
        country: config.country
      }
    }

    const response = {
      error: null,
      locale,
      txLimit: config.cashInTransactionLimit,
      idVerificationEnabled: config.idVerificationEnabled,
      smsVerificationEnabled: config.smsVerificationEnabled,
      cartridges,
      twoWayMode: config.cashOutEnabled,
      zeroConfLimit: config.zeroConfLimit,
      fiatTxLimit: config.cashOutTransactionLimit,
      reboot,
      rates: results.rates,
      balances: results.balances,
      coins: config.cryptoCurrencies,
      configVersion: results.currentConfigVersion
    }

    if (response.idVerificationEnabled) {
      response.idVerificationLimit = config.idVerificationLimit
    }

    return res.json(response)
  })
  .catch(next)
}

function getTx (req, res, next) {
  if (req.query.status) {
    return helpers.fetchStatusTx(req.params.id, req.query.status)
    .then(r => res.json(r))
    .catch(next)
  }

  return next(httpError('Not Found', 404))
}

function getPhoneTx (req, res, next) {
  if (req.query.phone) {
    return helpers.fetchPhoneTx(req.query.phone)
    .then(r => res.json(r))
    .catch(next)
  }

  return next(httpError('Not Found', 404))
}

function postTx (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)

  return Tx.post(_.set('deviceId', req.deviceId, req.body), pi)
  .then(tx => {
    if (tx.errorCode) throw httpError(tx.error, 500)
    return res.json(tx)
  })
  .catch(next)
}

function stateChange (req, res, next) {
  helpers.stateChange(req.deviceId, req.deviceTime, req.body)
  .then(() => respond(req, res))
  .catch(next)
}

function deviceEvent (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.logEvent(req.body)
  .then(() => respond(req, res))
  .catch(next)
}

function verifyUser (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyUser(req.body)
  .then(idResult => respond(req, res, idResult))
  .catch(next)
}

function verifyTx (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyTransaction(req.body)
  .then(idResult => respond(req, res, idResult))
  .catch(next)
}

function ca (req, res) {
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
  .then(ca => res.json({ca}))
  .catch(() => res.status(403).json({error: 'forbidden'}))
}

function pair (req, res, next) {
  const token = req.query.token
  const deviceId = req.deviceId

  return pairing.pair(token, deviceId)
  .then(valid => {
    if (valid) {
      return helpers.updateMachineDefaults(deviceId)
      .then(() => res.json({status: 'paired'}))
    }

    throw httpError('Pairing failed')
  })
  .catch(next)
}

function phoneCode (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  const phone = req.body.phone

  return pi.getPhoneCode(phone)
  .then(code => respond(req, res, {code}))
  .catch(err => {
    if (err.name === 'BadNumberError') throw httpError('Bad number', 410)
    throw err
  })
  .catch(next)
}

function errorHandler (err, req, res, next) {
  const statusCode = err.name === 'HTTPError'
  ? err.code || 500
  : 500

  const json = {error: err.message}

  logger.error(err)

  return res.status(statusCode).json(json)
}

function respond (req, res, _body, _status) {
  const status = _status || 200
  const body = _body || {}

  return res.status(status).json(body)
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

  if (delta > REQUEST_TTL) return res.status(408).json({error: 'stale'})
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

    return res.status(403).json({error: 'Forbidden'})
  })
  .catch(next)
}

const skip = (req, res) => _.includes(req.path, ['/poll', '/state']) && res.statusCode === 200

const configRequiredRoutes = [
  '/poll',
  '/event',
  '/verify_user',
  '/verify_transaction',
  '/phone_code',
  '/tx'
]

const app = express()
const localApp = express()

app.use(helmet({noCache: true}))
app.use(bodyParser.json())
app.use(morgan('dev', {skip}))

// These two have their own authorization
app.post('/pair', populateDeviceId, pair)
app.get('/ca', ca)

app.use(populateDeviceId)
if (!devMode) app.use(authorize)
app.use(configRequiredRoutes, populateSettings)
app.use(filterOldRequests)

app.get('/poll', poll)
app.post('/state', stateChange)

app.post('/event', deviceEvent)
app.post('/verify_user', verifyUser)
app.post('/verify_transaction', verifyTx)

app.post('/phone_code', phoneCode)
app.post('/tx', postTx)
app.get('/tx/:id', getTx)
app.get('/tx', getPhoneTx)

app.use(errorHandler)
app.use((req, res) => res.status(404).json({error: 'No such route'}))

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
  return settingsLoader.loadLatest()
  .then(poller.reload)
  .then(() => logger.info('Config reloaded'))
  .catch(err => {
    logger.error(err)
    res.sendStatus(500)
  })
})

function populateDeviceId (req, res, next) {
  const deviceId = ((typeof req.connection.getPeerCertificate === 'function' &&
  req.connection.getPeerCertificate().fingerprint)) || null

  req.deviceId = deviceId
  req.deviceTime = Date.parse(req.get('date'))

  next()
}

let oldVersionId = 'initial'

function populateSettings (req, res, next) {
  const versionId = req.headers['config-version']
  if (versionId !== oldVersionId) {
    console.log('DEBUG611: %s', versionId)
    oldVersionId = versionId
  }

  if (!versionId) {
    return settingsLoader.loadLatest()
    .then(settings => { req.settings = settings })
    .then(() => next())
    .catch(next)
  }

  settingsLoader.load(versionId)
  .then(settings => { req.settings = settings })
  .then(() => helpers.updateDeviceConfigVersion(versionId))
  .then(() => next())
  .catch(next)
}

module.exports = {app, localApp}
