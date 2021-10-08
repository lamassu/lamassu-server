const express = require('express')
const router = express.Router()
const semver = require('semver')
const sms = require('../sms')
const _ = require('lodash/fp')
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
const { getCustomerById } = require('../customers')
const machineLoader = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')

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

  customers.update(id, { authorizedOverride: 'blocked' })
    .then(customer => {
      notifier.complianceNotify(customer, req.deviceId, 'BLOCKED')
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
  date.setDate(date.getDate() + days)
  customers.update(id, { suspendedUntil: date })
    .then(customer => {
      notifier.complianceNotify(customer, req.deviceId, 'SUSPENDED', days)
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
      return Promise.all([getCustomerById(tx.customer_id), machineLoader.getMachine(tx.device_id, config)])
        .then(([customer, deviceConfig]) => {
          const formattedTx = _.mapKeys(_.camelCase)(tx)
          const localeConfig = configManager.getLocale(formattedTx.deviceId, config)
          const timezone = localeConfig.timezone.split(':')
          const dstOffset = timezone[1]

          const cashInCommission = new BN(1).plus(new BN(formattedTx.commissionPercentage))

          const rate = new BN(formattedTx.rawTickerPrice).multipliedBy(cashInCommission).decimalPlaces(2)
          const date = new Date()
          date.setMinutes(date.getMinutes() + parseInt(dstOffset))
          const dateString = `${date.toISOString().replace('T', ' ').slice(0, 19)}`

          const data = {
            operatorInfo: configManager.getOperatorInfo(config),
            location: deviceConfig.machineLocation,
            customerName: customer.name,
            customerPhone: customer.phone,
            session: formattedTx.id,
            time: dateString,
            direction: formattedTx.direction === 'cashIn' ? 'Cash-in' : 'Cash-out',
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

router.patch('/:id', updateCustomer)
router.patch('/:id/sanctions', triggerSanctions)
router.patch('/:id/block', triggerBlock)
router.patch('/:id/suspend', triggerSuspend)
router.patch('/:id/photos/idcarddata', updateIdCardData)
router.patch('/:id/:txId/photos/customerphoto', updateTxCustomerPhoto)
router.patch('/:id/smsreceipt', sendSmsReceipt)

module.exports = router
