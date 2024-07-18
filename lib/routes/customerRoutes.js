const express = require('express')
const router = express.Router()
const semver = require('semver')
const _ = require('lodash/fp')
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz/fp')
const { add, intervalToDuration } = require('date-fns/fp')
const uuid = require('uuid')

const sms = require('../sms')
const BN = require('../bn')
const compliance = require('../compliance')
const complianceTriggers = require('../compliance-triggers')
const configManager = require('../new-config-manager')
const customers = require('../customers')
const txs = require('../new-admin/services/transactions')
const httpError = require('../route-helpers').httpError
const notifier = require('../notifier')
const respond = require('../respond')
const { getTx } = require('../new-admin/services/transactions.js')
const machineLoader = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const customInfoRequestQueries = require('../new-admin/services/customInfoRequests')
const T = require('../time')
const plugins = require('../plugins')
const Tx = require('../tx')
const loyalty = require('../loyalty')
const logger = require('../logger')
const externalCompliance = require('../compliance-external')

function updateCustomerCustomInfoRequest (customerId, patch) {
  const promise = _.isNil(patch.data) ?
    Promise.resolve(null) :
    customInfoRequestQueries.setCustomerDataViaMachine(customerId, patch.infoRequestId, patch)
  return promise.then(() => customers.getById(customerId))
}

const createPendingManualComplianceNotifs = (settings, customer, deviceId) => {
  const customInfoRequests = _.reduce(
    (reqs, req) => _.set(req.info_request_id, req, reqs),
    {},
    _.get(['customInfoRequestData'], customer)
  )

  const isPending = field =>
    uuid.validate(field) ?
      _.get([field, 'override'], customInfoRequests) === 'automatic' :
      customer[`${field}At`]
        && (!customer[`${field}OverrideAt`]
            || customer[`${field}OverrideAt`].getTime() < customer[`${field}At`].getTime())

  const unnestCustomTriggers = triggersAutomation => {
    const customTriggers = _.fromPairs(_.map(({ id, type }) => [id, type], triggersAutomation.custom))
    return _.flow(
      _.unset('custom'),
      _.mapKeys(k => k === 'facephoto' ? 'frontCamera' : k),
      _.assign(customTriggers),
    )(triggersAutomation)
  }

  const isManual = v => v === 'Manual'

  const hasManualAutomation = triggersAutomation =>
    _.any(isManual, _.values(triggersAutomation))

  configManager.getTriggersAutomation(customInfoRequestQueries.getCustomInfoRequests(true), settings.config)
    .then(triggersAutomation => {
      triggersAutomation = unnestCustomTriggers(triggersAutomation)
      if (!hasManualAutomation(triggersAutomation)) return

      const pendingFields = _.filter(
        field => isManual(triggersAutomation[field]) && isPending(field),
        _.keys(triggersAutomation)
      )

      if (!_.isEmpty(pendingFields))
        notifier.complianceNotify(settings, customer, deviceId, 'PENDING_COMPLIANCE')
    })
}

function updateCustomer (req, res, next) {
  const id = req.params.id
  const machineVersion = req.query.version
  const txId = req.query.txId
  const patch = req.body
  const triggers = configManager.getTriggers(req.settings.config)
  const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
  const deviceId = req.deviceId
  const settings = req.settings

  if (patch.customRequestPatch) {
    return updateCustomerCustomInfoRequest(id, patch.customRequestPatch)
      .then(customer => {
        createPendingManualComplianceNotifs(settings, customer, deviceId)
        respond(req, res, { customer })
      })
      .catch(next)
  }

  // BACKWARDS_COMPATIBILITY 7.5
  // machines before 7.5 expect customer with sanctions result
  const isOlderMachineVersion = !machineVersion || semver.lt(machineVersion, '7.5.0-beta.0')
  customers.getById(id)
    .then(customer =>
      !customer ? Promise.reject(httpError('Not Found', 404)) :
      !isOlderMachineVersion ? {} :
      compliance.validationPatch(deviceId, !!compatTriggers.sanctions, _.merge(customer, patch))
    )
    .then(_.merge(patch))
    .then(newPatch => customers.updatePhotoCard(id, newPatch))
    .then(newPatch => customers.updateFrontCamera(id, newPatch))
    .then(newPatch => customers.update(id, newPatch, null, txId))
    .then(customer => {
      createPendingManualComplianceNotifs(settings, customer, deviceId)
      respond(req, res, { customer })
    })
    .catch(next)
}

function updateIdCardData (req, res, next) {
  const id = req.params.id
  const patch = req.body
  customers.getById(id)
    .then(customer => {
      if (!customer) { throw httpError('Not Found', 404) }
      return customers.updateIdCardData(patch, id)
        .then(() => customer)
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
  const settings = req.settings

  customers.update(id, { authorizedOverride: 'blocked' })
    .then(customer => {
      notifier.complianceNotify(settings, customer, req.deviceId, 'BLOCKED')
      return respond(req, res, { customer })
    })
    .catch(next)
}

function triggerSuspend (req, res, next) {
  const id = req.params.id
  const triggerId = req.body.triggerId
  const settings = req.settings

  const triggers = configManager.getTriggers(req.settings.config)
  const getSuspendDays = _.compose(_.get('suspensionDays'), _.find(_.matches({ id: triggerId })))

  const days = _.includes(triggerId, ['no-ff-camera', 'id-card-photo-disabled']) ? 1 : getSuspendDays(triggers)

  const suspensionDuration = intervalToDuration({ start: 0, end: T.day * days })

  customers.update(id, { suspendedUntil: add(suspensionDuration, new Date()) })
    .then(customer => {
      notifier.complianceNotify(settings, customer, req.deviceId, 'SUSPENDED', days)
      return respond(req, res, { customer })
    })
    .catch(next)
}

function updateTxCustomerPhoto (req, res, next) {
  const customerId = req.params.id
  const txId = req.params.txId
  const tcPhotoData = req.body.tcPhotoData
  const direction = req.body.direction

  Promise.all([customers.getById(customerId), txs.getTx(txId, direction)])
    .then(([customer, tx]) => {
      if (!customer || !tx) return
      return customers.updateTxCustomerPhoto(tcPhotoData)
        .then(newPatch => txs.updateTxCustomerPhoto(customerId, txId, direction, newPatch))
    })
    .then(() => respond(req, res, {}))
    .catch(next)
}

function buildSms (data, receiptOptions) {
  return Promise.all([getTx(data.session, data.txClass), loadLatestConfig()])
    .then(([tx, config]) => {
      return Promise.all([customers.getCustomerById(tx.customer_id), machineLoader.getMachine(tx.device_id, config)])
        .then(([customer, deviceConfig]) => {
          const formattedTx = _.mapKeys(_.camelCase)(tx)
          const localeConfig = configManager.getLocale(formattedTx.deviceId, config)
          const timezone = localeConfig.timezone

          const cashInCommission = new BN(1).plus(new BN(formattedTx.commissionPercentage))

          const rate = new BN(formattedTx.rawTickerPrice).multipliedBy(cashInCommission).decimalPlaces(2)
          const date = utcToZonedTime(timezone, zonedTimeToUtc(process.env.TZ, new Date()))
          const dateString = `${date.toISOString().replace('T', ' ').slice(0, 19)}`

          const data = {
            operatorInfo: configManager.getOperatorInfo(config),
            location: deviceConfig.machineLocation,
            customerName: customer.name,
            customerPhone: customer.phone,
            session: formattedTx.id,
            time: dateString,
            direction: formattedTx.txClass === 'cashIn' ? 'Cash-in' : 'Cash-out',
            fiat: `${formattedTx.fiat.toString()} ${formattedTx.fiatCode}`,
            crypto: `${sms.toCryptoUnits(BN(formattedTx.cryptoAtoms), formattedTx.cryptoCode)} ${formattedTx.cryptoCode}`,
            rate: `1 ${formattedTx.cryptoCode} = ${rate} ${formattedTx.fiatCode}`,
            address: formattedTx.toAddress,
            txId: formattedTx.txHash
          }

          return sms.formatSmsReceipt(data, receiptOptions)
        })
    })
}

function sendSmsReceipt (req, res, next) {
  const receiptOptions = _.omit(['active', 'sms'], configManager.getReceipt(req.settings.config))
  buildSms(req.body.data, receiptOptions)
    .then(smsRequest => {
      sms.sendMessage(req.settings, smsRequest)
        .then(() => respond(req, res, {}))
        .catch(next)
    })
}

function getExternalComplianceLink (req, res, next) {
  const customerId = req.query.customer
  const triggerId = req.query.trigger
  const isRetry = req.query.isRetry
  if (_.isNil(customerId) || _.isNil(triggerId)) return next(httpError('Not Found', 404))

  const settings = req.settings
  const triggers = configManager.getTriggers(settings.config)
  const trigger = _.find(it => it.id === triggerId)(triggers)
  const externalService = trigger.externalService

  if (isRetry) {
    return externalCompliance.createLink(settings, externalService, customerId)
      .then(url => respond(req, res, { url }))
  }

  return externalCompliance.createApplicant(settings, externalService, customerId)
    .then(applicant => customers.addExternalCompliance(customerId, externalService, applicant.id))
    .then(() => externalCompliance.createLink(settings, externalService, customerId))
    .then(url => respond(req, res, { url }))
}

function addOrUpdateCustomer (customerData, deviceId, config, isEmailAuth) {
  const triggers = configManager.getTriggers(config)
  const maxDaysThreshold = complianceTriggers.maxDaysThreshold(triggers)

  const customerKey = isEmailAuth ? customerData.email : customerData.phone
  const getFunc = isEmailAuth ? customers.getWithEmail : customers.get
  const addFunction = isEmailAuth ? customers.addWithEmail : customers.add

  return getFunc(customerKey)
    .then(customer => {
      if (customer) return customer

      return addFunction(customerData)
    })
    .then(customer => customers.getById(customer.id))
    .then(customer => {
      customers.updateLastAuthAttempt(customer.id, deviceId).catch(() => {
        logger.info('failure updating last auth attempt for customer ', customer.id)
      })
      return customer
    })
    .then(customer => {
      return Tx.customerHistory(customer.id, maxDaysThreshold)
        .then(result => {
          customer.txHistory = result
          return customer
        })
    })
    .then(customer => {
      return loyalty.getCustomerActiveIndividualDiscount(customer.id)
        .then(discount => ({ ...customer, discount }))
    })
}

function getOrAddCustomerPhone (req, res, next) {
  const deviceId = req.deviceId
  const customerData = req.body

  const pi = plugins(req.settings, deviceId)
  const phone = req.body.phone

  return pi.getPhoneCode(phone)
    .then(code => {
      return addOrUpdateCustomer(customerData, deviceId, req.settings.config, false)
        .then(customer => respond(req, res, { code, customer }))
    })
    .catch(err => {
      if (err.name === 'BadNumberError') throw httpError('Bad number', 401)
      throw err
    })
    .catch(next)
}

function getOrAddCustomerEmail (req, res, next) {
  const customerData = req.body

  const pi = plugins(req.settings, req.deviceId)
  const email = req.body.email

  return pi.getEmailCode(email)
    .then(code => {
      return addOrUpdateCustomer(customerData, req.settings.config, true)
        .then(customer => respond(req, res, { code, customer }))
    })
    .catch(err => {
      if (err.name === 'BadNumberError') throw httpError('Bad number', 401)
      throw err
    })
    .catch(next)
}

router.patch('/:id', updateCustomer)
router.patch('/:id/sanctions', triggerSanctions)
router.patch('/:id/block', triggerBlock)
router.patch('/:id/suspend', triggerSuspend)
router.patch('/:id/photos/idcarddata', updateIdCardData)
router.patch('/:id/:txId/photos/customerphoto', updateTxCustomerPhoto)
router.post('/:id/smsreceipt', sendSmsReceipt)
router.get('/external', getExternalComplianceLink)
router.post('/phone_code', getOrAddCustomerPhone)
router.post('/email_code', getOrAddCustomerEmail)

module.exports = router
