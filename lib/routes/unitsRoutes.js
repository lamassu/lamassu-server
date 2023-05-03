const express = require('express')
const { emptyMachineUnits, refillMachineUnits } = require('../machine-loader')
const router = express.Router()

const emptyUnitUpdateCounts = (req, res, next) => {
  const deviceId = req.deviceId
  const newUnits = req.body.newUnits

  return emptyMachineUnits({ deviceId, cashUnits: newUnits })
    .then(() => res.sendStatus(200))
    .catch(e => {
      console.error(e)
      return res.sendStatus(500)
    })
    .finally(next)
}

const refillUnitUpdateCounts = (req, res, next) => {
  const deviceId = req.deviceId
  const newUnits = req.body.newUnits

  return refillMachineUnits({ deviceId, cashUnits: newUnits })
    .then(() => res.sendStatus(200))
    .catch(e => {
      console.error(e)
      return res.sendStatus(500)
    })
    .finally(next)
}

router.post('/empty', emptyUnitUpdateCounts)
router.post('/refill', refillUnitUpdateCounts)

module.exports = router
