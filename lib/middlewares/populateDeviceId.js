const _ = require('lodash/fp')
const crypto = require('crypto')

const logger = require('../logger')

function sha256 (buf) {
  if (!buf) return null
  const hash = crypto.createHash('sha256')

  hash.update(buf)
  return hash.digest('hex').toString('hex')
}

const populateDeviceId = function (req, res, next) {
  const deviceId = _.isFunction(req.connection.getPeerCertificate)
    ? sha256(req.connection.getPeerCertificate()?.raw)
    : null

  if (!deviceId) return res.status(500).json({ error: 'Unable to find certificate' })
  req.deviceId = deviceId
  req.deviceTime = req.get('date')

  next()
}

module.exports = populateDeviceId
