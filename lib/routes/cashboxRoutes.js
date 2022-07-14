const express = require('express')
const _ = require('lodash/fp')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const notifier = require('../notifier')
const { getMachine, setMachine, getMachineName } = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const { getCashInSettings } = require('../new-config-manager')
const { AUTOMATIC } = require('../constants.js')

function notifyCashboxRemoval (req, res, next) {
  const operatorId = res.locals.operatorId

  return notifier.cashboxNotify(req.deviceId)
    .then(() => Promise.all([getMachine(req.deviceId), loadLatestConfig()]))
    .then(([machine, config]) => {
      const cashInSettings = getCashInSettings(config)
      if (cashInSettings.cashboxReset !== AUTOMATIC) {
        return Promise.all([
          cashbox.getMachineUnbatchedBills(req.deviceId),
          getMachineName(req.deviceId)
        ])
      }
      return cashbox.createCashboxBatch(req.deviceId, machine.cashbox)
        .then(batch => Promise.all([
          cashbox.getBatchById(batch.id),
          getMachineName(batch.device_id),
          setMachine({ deviceId: req.deviceId, action: 'emptyCashInBills' }, operatorId)  
        ]))
    })
    .then(([batch, machineName]) => res.status(200).send({ batch: _.merge(batch, { machineName }), status: 'OK' }))
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
