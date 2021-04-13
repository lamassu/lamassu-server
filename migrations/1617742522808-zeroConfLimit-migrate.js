const _ = require('lodash/fp')
var db = require('../lib/db')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

const isNil = val => val == null
const curriedGetCashout = _.curry(configManager.getCashOut)

exports.up = function (next) {
  db.tx(async t => {
    const settingsPromise = settingsLoader.loadLatest()
    const machinesPromise = t.any('SELECT device_id FROM devices')
    const [{ config }, machines] = await Promise.all([settingsPromise, machinesPromise])
    const cryptoCodes = configManager.getCryptosFromWalletNamespace(config)

    const zeroConfLimits = _.map(_.flow(_.get('device_id'), curriedGetCashout(_, config), _.get('zeroConfLimit')), machines)
    const minArr = _.min(zeroConfLimits)
    const min = !isNil(minArr) && minArr < Infinity ? Number(minArr) : 0

    _.forEach(cryptoCode => {
      const walletConfig = configManager.getWalletSettings(cryptoCode, config)
      const zeroConfLimit = _.get('zeroConfLimit', walletConfig)
      const key = `wallets_${cryptoCode}_zeroConfLimit`
      if (isNil(zeroConfLimit)) {
        config[key] = min
      }
    }, cryptoCodes)

    const regexp = /^cashOut_[0-9a-z]+_zeroConfLimit$/
    const keysToErase = _.keys(config).filter(key => key.match(regexp))

    _.forEach(key => {
      config[key] = null
    }, keysToErase)

    return settingsLoader.saveConfig(config)
  })
    .then(() => next())
    .catch(err => next(err))
}

exports.down = function (next) {
  next()
}
