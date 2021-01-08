const express = require('express')
const router = express.Router()
const _ = require('lodash/fp')

const state = require('../middlewares/state')
const logs = require('../logs')

const THROTTLE_LOGS_QUERY = 30 * 1000

function getLastSeen (req, res, next) {
  const deviceId = req.deviceId
  const timestamp = Date.now()
  const shouldTrigger = !state.canGetLastSeenMap[deviceId] ||
    timestamp - state.canGetLastSeenMap[deviceId] >= THROTTLE_LOGS_QUERY

  if (shouldTrigger) {
    state.canGetLastSeenMap[deviceId] = timestamp
    return logs.getLastSeen(deviceId)
      .then(r => res.json(r))
      .catch(next)
  }

  return res.status(408).json({})
}

function updateLogs (req, res, next) {
  return logs.update(req.deviceId, req.body.logs)
    .then(status => res.json({ success: status }))
    .catch(next)
}

router.get('/', getLastSeen)
router.post('/', updateLogs)

module.exports = router