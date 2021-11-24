const _ = require('lodash/fp')
const crypto = require('crypto')

const logger = require('../logger')

function sha256 (buf) {
  const hash = crypto.createHash('sha256')

  hash.update(buf)
  return hash.digest('hex').toString('hex')
}

const populateDeviceId = function (req, res, next) {
  logger.info(`DEBUG LOG - Method: ${req.method} Path: ${req.path}`)
  const deviceId = _.isFunction(req.connection.getPeerCertificate)
    ? sha256(req.connection.getPeerCertificate().raw)
    : null

  req.deviceId = deviceId
  req.deviceTime = req.get('date')

  next()
}

module.exports = populateDeviceId
