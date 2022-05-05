const plugins = require('../plugins')

module.exports = (req, res, next) =>
  plugins(req.settings, req.deviceId)
    .recordPing(req.deviceTime, req.query.version, req.query.model)
    .then(() => next())
    .catch(() => next())
