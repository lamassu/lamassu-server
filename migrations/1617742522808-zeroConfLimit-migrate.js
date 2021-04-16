const _ = require('lodash/fp')
var db = require('../lib/db')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

exports.up = function (next) {
  return db.tx(async t => {
    const settingsPromise = settingsLoader.loadLatest()
    const machinesPromise = t.any('SELECT device_id FROM devices')
    const [{ config }, machines] = await Promise.all([settingsPromise, machinesPromise])
    const cryptoCodes = configManager.getCryptosFromWalletNamespace(config)

    const deviceIds = _.map(_.get('device_id'))(machines)
    const getZeroConfLimit = _.compose(_.get('zeroConfLimit'), it => configManager.getCashOut(it, config))
    const zeroConfLimits = _.map(getZeroConfLimit)(deviceIds)

    const configMin = _.min(zeroConfLimits)
    const smallerZeroConf = _.isFinite(configMin) ? Number(configMin) : 0

    _.forEach(cryptoCode => {
      const walletConfig = configManager.getWalletSettings(cryptoCode, config)
      const zeroConfLimit = _.get('zeroConfLimit', walletConfig)

      if (_.isNil(zeroConfLimit)) {
        config[`wallets_${cryptoCode}_zeroConfLimit`] = smallerZeroConf
      }
    }, cryptoCodes)

    _.forEach(deviceId => {
      const key = `cashOut_${deviceId}_zeroConfLimit`
      if (_.has(key, config)) {
        config[key] = null
      }
    })(deviceIds)

    return settingsLoader.saveConfig(config)
  })
    .then(() => next())
    .catch(err => next(err))
}

exports.down = function (next) {
  next()
}
