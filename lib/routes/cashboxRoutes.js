const express = require('express')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const machine = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const { getCashInSettings } = require('../new-config-manager')

function notifyCashboxRemoval (req, res, next) {
  console.log('We got a notification for the cashbox removal!!')
  return machine.getMachine(req.deviceId)
    .then(machine => {
      loadLatestConfig()
        .then(async config => {
          console.log('entered the config')
          const cashInSettings = getCashInSettings(config)
          if (cashInSettings.automaticCashboxReset) {
            console.log('We proceed with the cashbox reset!!')
            await cashbox.createCashboxBatch(req.deviceId, machine.cashbox)
            await machine.setMachine({ deviceId: req.deviceId, action: 'emptyCashInBills' })
            return res.status(200).send({ status: 'OK' })
          }
        })
    })
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
