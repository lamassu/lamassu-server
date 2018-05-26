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
const E = require('./error')
const customers = require('./customers')
const logs = require('./logs')
const compliance = require('./compliance')

const argv = require('minimist')(process.argv.slice(2))

const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000

const pids = {}
const reboots = {}

const devMode = argv.dev || options.http

function checkHasLightning (settings) {
  return configManager.cryptoScoped('BTC', settings.config).layer2 !== 'no-layer2'
}

function poll (req, res, next) {
  const deviceId = req.deviceId
  const deviceTime = req.deviceTime
  const serialNumber = req.query.sn
  const pid = req.query.pid
  const settings = req.settings
  const config = configManager.machineScoped(deviceId, settings.config)
  const pi = plugins(settings, deviceId)
  const hasLightning = checkHasLightning(settings)

  pids[deviceId] = {pid, ts: Date.now()}

  return pi.pollQueries(serialNumber, deviceTime, req.query)
    .then(results => {
      const cassettes = results.cassettes

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
        smsVerificationActive: config.smsVerificationActive,
        smsVerificationThreshold: config.smsVerificationThreshold,
        hardLimitVerificationActive: config.hardLimitVerificationActive,
        hardLimitVerificationThreshold: config.hardLimitVerificationThreshold,
        idCardDataVerificationActive: config.idCardDataVerificationActive,
        idCardDataVerificationThreshold: config.idCardDataVerificationThreshold,
        idCardPhotoVerificationActive: config.idCardPhotoVerificationActive,
        idCardPhotoVerificationThreshold: config.idCardPhotoVerificationThreshold,
        sanctionsVerificationActive: config.sanctionsVerificationActive,
        sanctionsVerificationThreshold: config.sanctionsVerificationThreshold,
        crossRefVerificationActive: config.crossRefVerificationActive,
        crossRefVerificationThreshold: config.crossRefVerificationThreshold,
        frontCameraVerificationActive: config.frontCameraVerificationActive,
        frontCameraVerificationThreshold: config.frontCameraVerificationThreshold,
        cassettes,
        twoWayMode: config.cashOutEnabled,
        zeroConfLimit: config.zeroConfLimit,
        reboot,
        hasLightning
      }

      if (response.idVerificationEnabled) {
        response.idVerificationLimit = config.idVerificationLimit
      }

      return res.json(_.assign(response, results))
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
      if (tx.errorCode) {
        logger.error(tx.error)
        throw httpError(tx.error, 500)
      }

      return res.json(tx)
    })
    .catch(err => {
      if (err instanceof E.StaleTxError) return res.status(409).json({})
      if (err instanceof E.RatchetError) return res.status(409).json({})

      throw err
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

function addOrUpdateCustomer (req) {
  const customerData = req.body
  const config = configManager.unscoped(req.settings.config)

  return customers.get(customerData.phone)
    .then(customer => {
      if (customer) return customer

      return customers.add(req.body)
    })
    .then(customer => {
      return compliance.validationPatch(config, customer)
        .then(patch => {
          if (_.isEmpty(patch)) return customer
          return customers.update(customer.id, patch)
        })
    })
}

function getCustomerWithPhoneCode (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  const phone = req.body.phone

  return pi.getPhoneCode(phone)
    .then(code => {
      return addOrUpdateCustomer(req)
        .then(customer => respond(req, res, {code, customer}))
    })
    .catch(err => {
      if (err.name === 'BadNumberError') throw httpError('Bad number', 401)
      throw err
    })
    .catch(next)
}

function updateCustomer (req, res, next) {
  const id = req.params.id
  const patch = req.body
  const config = configManager.unscoped(req.settings.config)

  customers.getById(id)
    .then(customer => {
      if (!customer) { throw httpError('Not Found', 404) }

      const mergedCustomer = _.merge(customer, patch)
      return compliance.validationPatch(config, mergedCustomer)
        .then(_.merge(patch))
        .then(newPatch => customers.update(id, newPatch))
    })
    .then(customer => respond(req, res, {customer}))
    .catch(next)
}

function getLastSeen (req, res, next) {
  return logs.getLastSeen(req.deviceId)
    .then(r => res.json(r))
    .catch(next)
}

function updateLogs (req, res, next) {
  return logs.update(req.deviceId, req.body.logs)
    .then(status => res.json({success: status}))
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
  const model = req.query.model

  return pairing.pair(token, deviceId, model)
    .then(valid => {
      if (valid) {
        return helpers.updateMachineDefaults(deviceId)
          .then(() => res.json({status: 'paired'}))
      }

      throw httpError('Pairing failed')
    })
    .catch(next)
}

function errorHandler (err, req, res, next) {
  const statusCode = err.name === 'HTTPError'
    ? err.code || 500
    : 500

  const json = {error: err.message}

  if (statusCode >= 400) logger.error(err)

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
  const delta = Date.now() - Date.parse(deviceTime)

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

const skip = (req, res) => _.includes(req.path, ['/poll', '/state', '/logs']) &&
  res.statusCode === 200

const configRequiredRoutes = [
  '/poll',
  '/event',
  '/phone_code',
  '/customer',
  '/tx'
]

const app = express()
const localApp = express()

app.use(helmet({noCache: true}))
app.use(bodyParser.json())
app.use(morgan('dev', {skip, stream: logger.stream}))

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

app.post('/phone_code', getCustomerWithPhoneCode)
app.patch('/customer/:id', updateCustomer)

app.post('/tx', postTx)
app.get('/tx/:id', getTx)
app.get('/tx', getPhoneTx)
app.get('/logs', getLastSeen)
app.post('/logs', updateLogs)

app.use(errorHandler)
app.use((req, res) => {
  res.status(404).json({error: 'No such route'})
})

localApp.get('/pid', (req, res) => {
  const deviceId = req.query.device_id
  const pidRec = pids[deviceId]
  res.json(pidRec)
})

localApp.post('/reboot', (req, res) => {
  const deviceId = req.query.device_id
  const pid = pids[deviceId] && pids[deviceId].pid

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

function sha256 (buf) {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')

  hash.update(buf)
  return hash.digest('hex').toString('hex')
}

function populateDeviceId (req, res, next) {
  const deviceId = _.isFunction(req.connection.getPeerCertificate)
    ? sha256(req.connection.getPeerCertificate().raw)
    : null

  req.deviceId = deviceId
  req.deviceTime = req.get('date')

  next()
}

let oldVersionId = 'initial'

function populateSettings (req, res, next) {
  const versionId = req.headers['config-version']
  if (versionId !== oldVersionId) {
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
