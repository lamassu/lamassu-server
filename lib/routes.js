'use strict'

const morgan = require('morgan')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const _ = require('lodash/fp')
const express = require('express')
const nmd = require('nano-markdown')

const dbErrorCodes = require('./db-error-codes')
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
const THROTTLE_LOGS_QUERY = 30 * 1000
const THROTTLE_CLOCK_SKEW = 60 * 1000
const SETTINGS_CACHE_REFRESH = 60 * 60 * 1000

const pids = {}
const reboots = {}
const restartServicesMap = {}
const canGetLastSeenMap = {}
const canLogClockSkewMap = {}
const settingsCache = {}

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

  pids[deviceId] = { pid, ts: Date.now() }

  return pi.pollQueries(serialNumber, deviceTime, req.query)
    .then(results => {
      const cassettes = results.cassettes

      const reboot = pid && reboots[deviceId] && reboots[deviceId] === pid
      const restartServices = pid && restartServicesMap[deviceId] && restartServicesMap[deviceId] === pid
      const langs = config.machineLanguages

      const locale = {
        fiatCode: config.fiatCurrency,
        localeInfo: {
          primaryLocale: langs[0],
          primaryLocales: langs,
          country: config.country
        }
      }

      const terms = config.termsScreenActive && config.termsScreenText ? createTerms(config) : null

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
        receiptPrintingActive: config.receiptPrintingActive,
        terms,
        cassettes,
        twoWayMode: config.cashOutEnabled,
        zeroConfLimit: config.zeroConfLimit,
        reboot,
        restartServices,
        hasLightning,
        operatorInfo: {
          active: config.operatorInfoActive,
          name: config.operatorInfoName,
          phone: config.operatorInfoPhone,
          email: config.operatorInfoEmail,
          website: config.operatorInfoWebsite,
          companyNumber: config.operatorInfoCompanyNumber
        }
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
      // 204 so that l-m can ignore the error
      // this is fine because the request is polled and will be retried if needed.
      if (err.code === dbErrorCodes.SERIALIZATION_FAILURE) {
        logger.warn('Harmless DB conflict, the query will be retried.')
        return res.status(204).json({})
      }
      if (err instanceof E.StaleTxError) return res.status(409).json({ errorType: 'stale' })
      if (err instanceof E.RatchetError) return res.status(409).json({ errorType: 'ratchet' })

      throw err
    })
    .catch(next)
}

function stateChange (req, res, next) {
  helpers.stateChange(req.deviceId, req.deviceTime, req.body)
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
      return compliance.validationPatch(req.deviceId, config, customer)
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
        .then(customer => respond(req, res, { code, customer }))
    })
    .catch(err => {
      if (err.name === 'BadNumberError') throw httpError('Bad number', 401)
      throw err
    })
    .catch(next)
}

function updateCustomer (req, res, next) {
  const id = req.params.id
  const txId = req.query.txId
  const patch = req.body
  const config = configManager.unscoped(req.settings.config)

  customers.getById(id)
    .then(customer => {
      if (!customer) { throw httpError('Not Found', 404) }

      const mergedCustomer = _.merge(customer, patch)
      return compliance.validationPatch(req.deviceId, config, mergedCustomer)
        .then(_.merge(patch))
        .then(newPatch => customers.updatePhotoCard(id, newPatch))
        .then(newPatch => customers.updateFrontCamera(id, newPatch))
        .then(newPatch => customers.update(id, newPatch, null, txId))
    })
    .then(customer => respond(req, res, { customer }))
    .catch(next)
}

function getLastSeen (req, res, next) {
  const deviceId = req.deviceId
  const timestamp = Date.now()
  const shouldTrigger = !canGetLastSeenMap[deviceId] ||
    timestamp - canGetLastSeenMap[deviceId] >= THROTTLE_LOGS_QUERY

  if (shouldTrigger) {
    canGetLastSeenMap[deviceId] = timestamp
    return logs.getLastSeen(deviceId)
      .then(r => res.json(r))
      .catch(next)
  }

  return res.status(408).json({})
}

function updateLogs (req, res, next) {
  return logs.update(req.deviceId, req.body.logs)
    .then(status => res.json({ success: status }))
    .catch(next)
}

function ca (req, res) {
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
    .then(ca => res.json({ ca }))
    .catch(() => res.status(403).json({ error: 'forbidden' }))
}

function pair (req, res, next) {
  const token = req.query.token
  const deviceId = req.deviceId
  const model = req.query.model

  return pairing.pair(token, deviceId, model)
    .then(valid => {
      if (valid) {
        return helpers.updateMachineDefaults(deviceId)
          .then(() => res.json({ status: 'paired' }))
      }

      throw httpError('Pairing failed')
    })
    .catch(next)
}

function errorHandler (err, req, res, next) {
  const statusCode = err.name === 'HTTPError'
    ? err.code || 500
    : 500

  const json = { error: err.message }

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
  const deviceId = req.deviceId
  const timestamp = Date.now()
  const delta = timestamp - Date.parse(deviceTime)

  const shouldTrigger = !canLogClockSkewMap[deviceId] ||
    timestamp - canLogClockSkewMap[deviceId] >= THROTTLE_CLOCK_SKEW

  if (delta > CLOCK_SKEW && shouldTrigger) {
    canLogClockSkewMap[deviceId] = timestamp
    logger.error('Clock skew with lamassu-machine[%s] too high [%ss], adjust lamassu-machine clock',
      req.deviceName, (delta / 1000).toFixed(2))
  }

  if (delta > REQUEST_TTL) return res.status(408).json({ error: 'stale' })
  next()
}

function authorize (req, res, next) {
  const deviceId = req.deviceId

  return pairing.isPaired(deviceId)
    .then(deviceName => {
      if (deviceName) {
        req.deviceId = deviceId
        req.deviceName = deviceName
        return next()
      }

      return res.status(403).json({ error: 'Forbidden' })
    })
    .catch(next)
}

const skip = (req, res) => _.includes(req.path, ['/poll', '/state', '/logs']) && _.includes(res.statusCode, [200, 408])

const configRequiredRoutes = [
  '/poll',
  '/event',
  '/phone_code',
  '/customer',
  '/tx'
]

const app = express()
const localApp = express()

app.use(helmet({ noCache: true }))
app.use(bodyParser.json({ limit: '2mb' }))
app.use(morgan('dev', { skip, stream: logger.stream }))

// These two have their own authorization
app.post('/pair', populateDeviceId, pair)
app.get('/ca', ca)

app.use(populateDeviceId)
if (!devMode) app.use(authorize)
app.use(configRequiredRoutes, populateSettings)
app.use(filterOldRequests)

app.get('/poll', poll)
app.post('/state', stateChange)

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
  res.status(404).json({ error: 'No such route' })
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

localApp.post('/restartServices', (req, res) => {
  const deviceId = req.query.device_id
  const pid = pids[deviceId] && pids[deviceId].pid

  if (!deviceId || !pid) {
    return res.sendStatus(400)
  }

  restartServicesMap[deviceId] = pid
  res.sendStatus(200)
})

localApp.post('/dbChange', (req, res, next) => {
  settingsCache.cache = null
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

  // Clear cache every hour
  if (Date.now() - settingsCache.timestamp > SETTINGS_CACHE_REFRESH) {
    settingsCache.cache = null
  }

  if (!versionId && settingsCache.cache) {
    req.settings = settingsCache.cache
    return next()
  }

  if (!versionId && !settingsCache.cache) {
    return settingsLoader.loadLatest()
      .then(settings => {
        settingsCache.cache = settings
        settingsCache.timestamp = Date.now()
        req.settings = settings
      })
      .then(() => next())
      .catch(next)
  }

  settingsLoader.load(versionId)
    .then(settings => { req.settings = settings })
    .then(() => helpers.updateDeviceConfigVersion(versionId))
    .then(() => next())
    .catch(next)
}

function createTerms (config) {
  return {
    active: config.termsScreenActive,
    title: config.termsScreenTitle,
    text: nmd(config.termsScreenText),
    accept: config.termsAcceptButtonText,
    cancel: config.termsCancelButtonText
  }
}

module.exports = { app, localApp }
