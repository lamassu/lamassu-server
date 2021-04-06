const _ = require('lodash/fp')
var db = require('../lib/db')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

exports.up = function (next) {
  db.tx(async t => {
    let min = Infinity
    const sp = settingsLoader.loadLatest()
    const mp = t.any('SELECT device_id FROM devices')
    const [{ config }, machines] = await Promise.all([sp, mp])
    const cryptoCurrencies = config.locale_cryptoCurrencies
    _.forEach(o => {
      const machineId = o.device_id
      const cashOutConfig = configManager.getCashOut(machineId, config)
      const zeroConfLimit = cashOutConfig.zeroConfLimit || Infinity
      if (zeroConfLimit < min) {
        min = zeroConfLimit
      }
    }, machines)
    if (min === Infinity) {
      min = 0
    }
    _.forEach(cryptoCode => {
      const walletConfig = configManager.getWalletSettings(cryptoCode, config)
      const zeroConfLimit = walletConfig.zeroConfLimit || null
      const key = `wallets_${cryptoCode}_zeroConfLimit`
      if (!zeroConfLimit) {
        config[key] = Number(min)
      }
    }, cryptoCurrencies)
    return settingsLoader.saveConfig(config)
  })
    .then(() => next())
    .catch(err => next(err))
}

exports.down = function (next) {
  next()
}
