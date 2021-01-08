const _ = require('lodash/fp')

function sha256 (buf) {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')

  hash.update(buf)
  return hash.digest('hex').toString('hex')
}

const populateDeviceId = function (req, res, next) {
  const deviceId = _.isFunction(req.connection.getPeerCertificate)
    ? sha256(req.connection.getPeerCertificate().raw)
    : null

  req.deviceId = deviceId
  req.deviceTime = req.get('date')

  next()
}

module.exports = populateDeviceId