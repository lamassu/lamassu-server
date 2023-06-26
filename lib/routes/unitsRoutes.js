const express = require('express')
const { emptyMachineUnits, refillMachineUnits } = require('../machine-loader')
const router = express.Router()

const emptyUnitUpdateCounts = (req, res, next) => {
  const deviceId = req.deviceId
  const { units: newUnits, fiatCode } = req.body

  return emptyMachineUnits({ deviceId, newUnits: newUnits, fiatCode })
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

const refillUnitUpdateCounts = (req, res, next) => {
  const deviceId = req.deviceId
  const { units: newUnits } = req.body

  return refillMachineUnits({ deviceId, newUnits: newUnits })
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

router.post('/empty', emptyUnitUpdateCounts)
router.post('/refill', refillUnitUpdateCounts)

module.exports = router
