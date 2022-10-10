const { saveConfig } = require('../lib/new-settings-loader')

exports.up = next => saveConfig({ 'commissions_cashOutFixedFee': 0 })
  .then(next)
  .catch(next)

exports.down = next => next()
