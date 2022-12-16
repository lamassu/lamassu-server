const express = require('express')
const _ = require('lodash/fp')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const notifier = require('../notifier')
const { getMachine, setMachine, getMachineName } = require('../machine-loader')
const { loadLatestConfig } = require('../new-settings-loader')
const { getCashInSettings } = require('../new-config-manager')
const { AUTOMATIC } = require('../constants')
const logger = require('../logger')

function notifyCashboxRemoval (req, res, next) {
  const operatorId = res.locals.operatorId

  logger.info(`** DEBUG ** - Cashbox removal - Received a cashbox opening request from device ${req.deviceId}`)

  return notifier.cashboxNotify(req.deviceId)
    .then(() => Promise.all([getMachine(req.deviceId), loadLatestConfig()]))
    .then(([machine, config]) => {
      logger.info('** DEBUG ** - Cashbox removal - Retrieving system options for cash-in')
      const cashInSettings = getCashInSettings(config)
      if (cashInSettings.cashboxReset !== AUTOMATIC) {
        logger.info('** DEBUG ** - Cashbox removal - Cashbox reset is set to manual. A cashbox batch will NOT be created')
        logger.info(`** DEBUG ** - Cashbox removal - Process finished`)
        return Promise.all([
          cashbox.getMachineUnbatchedBills(req.deviceId),
          getMachineName(req.deviceId)
        ])
      }
      logger.info('** DEBUG ** - Cashbox removal - Cashbox reset is set to automatic. A cashbox batch WILL be created')
      logger.info('** DEBUG ** - Cashbox removal - Creating new batch...')
      return cashbox.createCashboxBatch(req.deviceId, machine.cashbox)
        .then(batch => {
          logger.info(`** DEBUG ** - Cashbox removal - Finished creating the new cashbox batch`)
          logger.info(`** DEBUG ** - Cashbox removal - Resetting the cashbox counter on device ${req.deviceId}`)
          return Promise.all([
            cashbox.getBatchById(batch.id),
            getMachineName(batch.device_id),
            setMachine({ deviceId: req.deviceId, action: 'emptyCashInBills' }, operatorId)  
          ])
        })
    })
    .then(([batch, machineName]) => {
      logger.info(`** DEBUG ** - Cashbox removal - Process finished`)
      return res.status(200).send({ batch: _.merge(batch, { machineName }), status: 'OK' })
    })
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
