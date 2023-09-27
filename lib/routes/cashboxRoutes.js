const express = require('express')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const notifier = require('../notifier')
const { getMachine, setMachine } = require('../machine-loader')
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
        return res.status(200).send({ status: 'OK' })
      }
      logger.info('** DEBUG ** - Cashbox removal - Cashbox reset is set to automatic. A cashbox batch WILL be created')
      logger.info('** DEBUG ** - Cashbox removal - Creating new batch...')
      return cashbox.createCashboxBatch(req.deviceId, machine.cashUnits.cashbox)
        .then(() => {
          logger.info(`** DEBUG ** - Cashbox removal - Process finished`)
          return res.status(200).send({ status: 'OK' })
        })
    })
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
