const express = require('express')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const { getMachine, setMachine } = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const { getCashInSettings } = require('../new-config-manager')

function notifyCashboxRemoval (req, res, next) {
  return getMachine(req.deviceId)
    .then(machine => {
      loadLatestConfig()
        .then(async config => {
          const cashInSettings = getCashInSettings(config)
          console.log(cashInSettings)
          if (cashInSettings.cashboxReset === 'Automatic') {
            await cashbox.createCashboxBatch(req.deviceId, machine.cashbox)
            await setMachine({ deviceId: req.deviceId, action: 'emptyCashInBills' })
            return res.status(200).send({ status: 'OK' })
          }
        })
    })
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
