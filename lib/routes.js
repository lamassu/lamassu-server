'use strict'

const compression = require('compression')
const morgan = require('morgan')
const helmet = require('helmet')
const nocache = require('nocache')
const bodyParser = require('body-parser')
const _ = require('lodash/fp')
const express = require('express')
const nmd = require('nano-markdown')
const semver = require('semver')

const dbErrorCodes = require('./db-error-codes')
const options = require('./options')
const logger = require('./logger')
const configManager = require('./new-config-manager')
const machineLoader = require('./machine-loader')
const complianceTriggers = require('./compliance-triggers')
const pairing = require('./pairing')
const newSettingsLoader = require('./new-settings-loader')
const plugins = require('./plugins')
const helpers = require('./route-helpers')
const poller = require('./poller')
const Tx = require('./tx')
const E = require('./error')
const customers = require('./customers')
const logs = require('./logs')
const compliance = require('./compliance')
const promoCodes = require('./promo-codes')
const BN = require('./bn')
const commissionMath = require('./commission-math')
const notifier = require('./notifier')

const version = require('../package.json').version

const argv = require('minimist')(process.argv.slice(2))

const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000
const THROTTLE_LOGS_QUERY = 30 * 1000
const THROTTLE_CLOCK_SKEW = 60 * 1000
const SETTINGS_CACHE_REFRESH = 60 * 60 * 1000

const pids = {}
const reboots = {}
const shutdowns = {}
const restartServicesMap = {}
const canGetLastSeenMap = {}
const canLogClockSkewMap = {}
const settingsCache = {}

const devMode = argv.dev || options.http

function checkHasLightning (settings) {
  return configManager.getWalletSettings('BTC', settings.config).layer2 !== 'no-layer2'
}

function poll (req, res, next) {
  const machineVersion = req.query.version
  const machineModel = req.query.model
  const numOfCassettes = req.query.numOfCassettes
  const deviceId = req.deviceId
  const deviceTime = req.deviceTime
  const serialNumber = req.query.sn
  const pid = req.query.pid
  const settings = req.settings
  const localeConfig = configManager.getLocale(deviceId, settings.config)
  const pi = plugins(settings, deviceId)
  const hasLightning = checkHasLightning(settings)

  const triggers = configManager.getTriggers(settings.config)

  const operatorInfo = configManager.getOperatorInfo(settings.config)
  const machineInfo = { deviceId: req.deviceId, deviceName: req.deviceName }
  const cashOutConfig = configManager.getCashOut(deviceId, settings.config)
  const receipt = configManager.getReceipt(settings.config)
  const terms = configManager.getTermsConditions(settings.config)

  pids[deviceId] = { pid, ts: Date.now() }

  return pi.pollQueries(serialNumber, deviceTime, req.query, machineVersion, machineModel)
    .then(results => {
      const cassettes = results.cassettes

      const reboot = pid && reboots[deviceId] && reboots[deviceId] === pid
      const shutdown = pid && shutdowns[deviceId] && shutdowns[deviceId] === pid
      const restartServices = pid && restartServicesMap[deviceId] && restartServicesMap[deviceId] === pid
      const langs = localeConfig.languages

      const locale = {
        fiatCode: localeConfig.fiatCurrency,
        localeInfo: {
          primaryLocale: langs[0],
          primaryLocales: langs,
          country: localeConfig.country
        }
      }

      const response = {
        error: null,
        locale,
        version,
        receiptPrintingActive: receipt.active,
        cassettes,
        twoWayMode: cashOutConfig.active,
        zeroConfLimit: cashOutConfig.zeroConfLimit,
        reboot,
        shutdown,
        restartServices,
        hasLightning,
        receipt,
        operatorInfo,
        machineInfo,
        triggers
      }
      // BACKWARDS_COMPATIBILITY 7.5
      // machines before 7.5 expect old compliance
      if (!machineVersion || semver.lt(machineVersion, '7.5.0-beta.0')) {
        const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
        response.smsVerificationActive = !!compatTriggers.sms
        response.smsVerificationThreshold = compatTriggers.sms
        response.idCardDataVerificationActive = !!compatTriggers.idCardData
        response.idCardDataVerificationThreshold = compatTriggers.idCardData
        response.idCardPhotoVerificationActive = !!compatTriggers.idCardPhoto
        response.idCardPhotoVerificationThreshold = compatTriggers.idCardPhoto
        response.sanctionsVerificationActive = !!compatTriggers.sancations
        response.sanctionsVerificationThreshold = compatTriggers.sancations
        response.frontCameraVerificationActive = !!compatTriggers.facephoto
        response.frontCameraVerificationThreshold = compatTriggers.facephoto
      }

      // BACKWARDS_COMPATIBILITY 7.4.9
      // machines before 7.4.9 expect t&c on poll
      if (!machineVersion || semver.lt(machineVersion, '7.4.9')) {
        response.terms = createTerms(terms)
      }
      return res.json(_.assign(response, results))
    })
    .catch(next)
}

function getTermsConditions (req, res, next) {
  const deviceId = req.deviceId
  const settings = req.settings

  const terms = configManager.getTermsConditions(settings.config)

  const pi = plugins(settings, deviceId)

  return pi.fetchCurrentConfigVersion().then(version => {
    return res.json({ terms: createTerms(terms), version })
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

function notifyCashboxRemoval (req, res, next) {
  Promise.resolve()
    .then(() => {
      logger.log(`Device ${req.deviceId} had its cashbox removed.`)
      return res.status(200).send({ status: 'OK' })
    })
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

function verifyPromoCode (req, res, next) {
  promoCodes.getPromoCode(req.body.codeInput)
    .then(promoCode => {
      if (!promoCode) return next()

      const transaction = req.body.tx
      const commissions = configManager.getCommissions(transaction.cryptoCode, req.deviceId, req.settings.config)
      const tickerRate = BN(transaction.rawTickerPrice)
      const discount = commissionMath.getDiscountRate(promoCode.discount, commissions[transaction.direction])
      const rates = {
        [transaction.cryptoCode]: {
          [transaction.direction]: (transaction.direction === 'cashIn')
            ? tickerRate.mul(discount).round(5)
            : tickerRate.div(discount).round(5)
        }
      }

      respond(req, res, {
        promoCode: promoCode,
        newRates: rates
      })
    })
    .catch(next)
}

function networkHeartbeat (req, res, next) {
  return machineLoader.updateNetworkHeartbeat(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

function networkPerformance (req, res, next) {
  return machineLoader.updateNetworkPerformance(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

function addOrUpdateCustomer (req) {
  const customerData = req.body
  const machineVersion = req.query.version
  const triggers = configManager.getTriggers(req.settings.config)
  const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
  const maxDaysThreshold = complianceTriggers.maxDaysThreshold(triggers)

  return customers.get(customerData.phone)
    .then(customer => {
      if (customer) return customer

      return customers.add(req.body)
    })
    .then(customer => {
      // BACKWARDS_COMPATIBILITY 7.5
      // machines before 7.5 expect customer with sanctions result
      const isOlderMachineVersion = !machineVersion || semver.lt(machineVersion, '7.5.0-beta.0')
      const shouldRunOfacCompat = !compatTriggers.sanctions && isOlderMachineVersion
      if (!shouldRunOfacCompat) return customer

      return compliance.validationPatch(req.deviceId, !!compatTriggers.sanctions, customer)
        .then(patch => {
          if (_.isEmpty(patch)) return customer
          return customers.update(customer.id, patch)
        })
    }).then(customer => {
      return Tx.customerHistory(customer.id, maxDaysThreshold)
        .then(result => {
          customer.txHistory = result
          return customer
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
  const machineVersion = req.query.version
  const txId = req.query.txId
  const patch = req.body
  const triggers = configManager.getTriggers(req.settings.config)
  const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)

  customers.getById(id)
    .then(customer => {
      if (!customer) { throw httpError('Not Found', 404) }

      const mergedCustomer = _.merge(customer, patch)

      // BACKWARDS_COMPATIBILITY 7.5
      // machines before 7.5 expect customer with sanctions result
      const isOlderMachineVersion = !machineVersion || semver.lt(machineVersion, '7.5.0-beta.0')

      return Promise.resolve({})
        .then(emptyObj => {
          if (!isOlderMachineVersion) return Promise.resolve(emptyObj)
          return compliance.validationPatch(req.deviceId, !!compatTriggers.sanctions, mergedCustomer)
        })
        .then(_.merge(patch))
        .then(newPatch => customers.updatePhotoCard(id, newPatch))
        .then(newPatch => customers.updateFrontCamera(id, newPatch))
        .then(newPatch => customers.update(id, newPatch, null, txId))
    })
    .then(customer => respond(req, res, { customer }))
    .catch(next)
}

function triggerSanctions (req, res, next) {
  const id = req.params.id

  customers.getById(id)
    .then(customer => {
      if (!customer) { throw httpError('Not Found', 404) }

      return compliance.validationPatch(req.deviceId, true, customer)
        .then(patch => customers.update(id, patch))

    })
    .then(customer => respond(req, res, { customer }))
    .catch(next)
}

function triggerBlock (req, res, next) {
  const id = req.params.id

  customers.update(id, { authorizedOverride: 'blocked' })
    .then(customer => {
      notifier.notifyIfActive('compliance', 'customerComplianceNotify', customer, req.deviceId, 'BLOCKED')
      return respond(req, res, { customer })
    })
    .catch(next)
}

function triggerSuspend (req, res, next) {
  const id = req.params.id
  const triggerId = req.body.triggerId

  const triggers = configManager.getTriggers(req.settings.config)
  const getSuspendDays = _.compose(_.get('suspensionDays'), _.find(_.matches({ id: triggerId })))

  const days = triggerId === 'no-ff-camera' ? 1 : getSuspendDays(triggers)

  const date = new Date()
  date.setDate(date.getDate() + days);
  customers.update(id, { suspendedUntil: date })
    .then(customer => {
      notifier.notifyIfActive('compliance', 'customerComplianceNotify', customer, req.deviceId, 'SUSPENDED', days)
      return respond(req, res, { customer })
    })
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
  const numOfCassettes = req.query.numOfCassettes

  return pairing.pair(token, deviceId, model, numOfCassettes)
    .then(valid => {
      if (valid) {
        return res.json({ status: 'paired' })
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
  const customer = _.getOr({ sanctions: true }, ['customer'], body)
  // sanctions can be null for new customers so we can't use falsy checks
  if (customer.sanctions === false) {
    notifier.notifyIfActive('compliance', 'sanctionsNotify', customer, req.body.phone)
  }
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
  '/terms_conditions',
  '/event',
  '/phone_code',
  '/customer',
  '/tx',
  '/verify_promo_code'
]

const app = express()
const localApp = express()

app.use(compression({ threshold: 500 }))
app.use(helmet())
app.use(nocache())
app.use(bodyParser.json({ limit: '2mb' }))
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', { stream: logger.stream }))

// These two have their own authorization
app.post('/pair', populateDeviceId, pair)
app.get('/ca', ca)

app.use(populateDeviceId)
if (!devMode) app.use(authorize)
app.use(configRequiredRoutes, populateSettings)
app.use(filterOldRequests)

app.get('/poll', poll)
app.get('/terms_conditions', getTermsConditions)
app.post('/state', stateChange)
app.post('/cashbox/removal', notifyCashboxRemoval)

app.post('/network/heartbeat', networkHeartbeat)
app.post('/network/performance', networkPerformance)

app.post('/verify_user', verifyUser)
app.post('/verify_transaction', verifyTx)
app.post('/verify_promo_code', verifyPromoCode)

app.post('/phone_code', getCustomerWithPhoneCode)
app.patch('/customer/:id', updateCustomer)
app.patch('/customer/:id/sanctions', triggerSanctions)
app.patch('/customer/:id/block', triggerBlock)
app.patch('/customer/:id/suspend', triggerSuspend)

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

localApp.post('/shutdown', (req, res) => {
  const deviceId = req.query.device_id
  const pid = pids[deviceId] && pids[deviceId].pid

  if (!deviceId || !pid) {
    return res.sendStatus(400)
  }

  shutdowns[deviceId] = pid
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
  return newSettingsLoader.loadLatest()
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
  console.log(`DEBUG LOG - Method: ${req.method} Path: ${req.path}`)
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
    return newSettingsLoader.loadLatest()
      .then(settings => {
        settingsCache.cache = settings
        settingsCache.timestamp = Date.now()
        req.settings = settings
      })
      .then(() => next())
      .catch(next)
  }

  newSettingsLoader.load(versionId)
    .then(settings => { req.settings = settings })
    .then(() => helpers.updateDeviceConfigVersion(versionId))
    .then(() => next())
    .catch(next)
}

function createTerms (terms) {
  if (!terms.active || !terms.text) return null

  return {
    active: terms.active,
    title: terms.title,
    text: nmd(terms.text),
    accept: terms.acceptButtonText,
    cancel: terms.cancelButtonText
  }
}

module.exports = { app, localApp }
