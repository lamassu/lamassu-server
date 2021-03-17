const express = require('express')
const router = express.Router()
const semver = require('semver')
const _ = require('lodash/fp')

const compliance = require('../compliance')
const complianceTriggers = require('../compliance-triggers')
const configManager = require('../new-config-manager')
const customers = require('../customers')

function httpError (msg, code) {
  const err = new Error(msg)
  err.name = 'HTTPError'
  err.code = code || 500

  return err
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
    .then(customer => res.status(200).json({ customer }))
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
    .then(customer => res.status(200).json({ customer }))
    .catch(next)
}

function triggerBlock (req, res, next) {
  const id = req.params.id

  customers.update(id, { authorizedOverride: 'blocked' })
    .then(customer => res.status(200).json({ customer }))
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
    .then(customer => res.status(200).json({ customer }))
    .catch(next)
}

router.patch('/:id', updateCustomer)
router.patch('/:id/sanctions', triggerSanctions)
router.patch('/:id/block', triggerBlock)
router.patch('/:id/suspend', triggerSuspend)

module.exports = router