const pairing = require('../pairing')

const authorize = function (req, res, next) {
  const deviceId = req.deviceId

  return pairing.isPaired(deviceId)
    .then(deviceName => {
      if (deviceName) {
        req.deviceId = deviceId
        req.deviceName = deviceName
        return next()
      }

      return res.status(403).json({ error: 'Forbidden' })
    })
    .catch(next)
}

module.exports = authorize
