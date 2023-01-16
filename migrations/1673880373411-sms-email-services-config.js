const _ = require('lodash/fp')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  const newConfig = {}
  return loadLatest()
    .then(({ config }) => {
      if (!_.isNil(config.api_service_sms) && !_.isNil(config.api_service_email)) return
      newConfig[`api_service_sms`] = 'twilio'
      newConfig[`api_service_email`] = 'mailgun'
      return saveConfig(newConfig)
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
