const state = require('./state')
const logger = require('../logger')

const CLOCK_SKEW = 60 * 1000
const REQUEST_TTL = 3 * 60 * 1000
const THROTTLE_CLOCK_SKEW = 60 * 1000

function filterOldRequests (req, res, next) {
  const deviceTime = req.deviceTime
  const deviceId = req.deviceId
  const timestamp = Date.now()
  const delta = timestamp - Date.parse(deviceTime)

  const shouldTrigger = !state.canLogClockSkewMap[deviceId] ||
    timestamp - state.canLogClockSkewMap[deviceId] >= THROTTLE_CLOCK_SKEW

  if (delta > CLOCK_SKEW && shouldTrigger) {
    state.canLogClockSkewMap[deviceId] = timestamp
    logger.error('Clock skew with lamassu-machine[%s] too high [%ss], adjust lamassu-machine clock',
      req.deviceName, (delta / 1000).toFixed(2))
  }

  if (delta > REQUEST_TTL) return res.status(408).json({ error: 'stale' })
  next()
}

module.exports = filterOldRequests