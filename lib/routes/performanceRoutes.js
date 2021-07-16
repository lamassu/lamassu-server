const express = require('express')
const router = express.Router()

const { updateNetworkHeartbeat, updateNetworkPerformance } = require('../machine-loader')

function networkHeartbeat (req, res, next) {
  return updateNetworkHeartbeat(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

function networkPerformance (req, res, next) {
  return updateNetworkPerformance(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

router.post('/heartbeat', networkHeartbeat)
router.post('/performance', networkPerformance)

module.exports = router
