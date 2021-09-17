const express = require('express')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const { getMachine, setMachine } = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const { getCashInSettings } = require('../new-config-manager')
const { AUTOMATIC } = require('../constants.js')

function notifyCashboxRemoval (req, res, next) {
  const operatorId = res.locals.operatorId
  return Promise.all([getMachine(req.deviceId), loadLatestConfig()])
    .then(([machine, config]) => {
      const cashInSettings = getCashInSettings(config)
      if (cashInSettings.cashboxReset !== AUTOMATIC) {
        return res.status(200).send({ status: 'OK' })
      }
      return cashbox.createCashboxBatch(req.deviceId, machine.cashbox)
        .then(() => setMachine({ deviceId: req.deviceId, action: 'emptyCashInBills' }, operatorId))
        .then(() => res.status(200).send({ status: 'OK' }))
    })
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
