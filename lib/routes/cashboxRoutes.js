const express = require('express')
const router = express.Router()

const cashbox = require('../cashbox-batches')
const machine = require('../machine-loader')

function notifyCashboxRemoval (req, res, next) {
  Promise.resolve()
    .then(() => machine.getMachine(req.deviceId))
    .then(machine => cashbox.createCashboxBatch(req.deviceId, machine.cashbox))
    .then(() => machine.emptyCashInBills(req))
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

router.post('/removal', notifyCashboxRemoval)

module.exports = router
