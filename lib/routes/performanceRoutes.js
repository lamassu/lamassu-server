const express = require('express')
const router = express.Router()

const { getMachine } = require('../machine-loader')

function networkHeartbeat (req, res, next) {
  return getMachine(req.deviceId)
    .then(machine => {
      console.log(`${machine.name} network heartbeat:`)
      console.log(req.body)
      return res.status(200).send({ status: 'OK' })
    })
    .catch(next)
}

function networkPerformance (req, res, next) {
  return getMachine(req.deviceId)
    .then(machine => {
      console.log(`${machine.name} network performance:`)
      console.log(req.body)
      return res.status(200).send({ status: 'OK' })
    })
    .catch(next)
}

router.post('/heartbeat', networkHeartbeat)
router.post('/performance', networkPerformance)

module.exports = router
