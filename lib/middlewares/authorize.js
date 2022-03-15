const pairing = require('../pairing')
const logger = require('../logger')

const authorize = function (req, res, next) {
  return pairing.isPaired(req.deviceId)
    .then(deviceName => {
      if (deviceName) {
        req.deviceName = deviceName
        return next()
      }

      logger.error(`Device ${req.deviceId} not found`)
      return res.status(403).json({ error: 'Forbidden' })
    })
    .catch(error => {
      logger.error(error)
      return next()
    })
}

module.exports = authorize
