const _ = require('lodash/fp')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

exports.up = async function (next) {
  const config = await settingsLoader.loadLatestConfig()
  const cryptoCodes = configManager.getCryptosFromWalletNamespace(config)
  _.forEach(cryptoCode => {
    const key = `wallets_${cryptoCode}_zeroConf`
    const zeroConfSetting = _.get(key, config)
    if (cryptoCode === 'BTC' && zeroConfSetting === 'blockcypher') return
    if (!_.isNil(zeroConfSetting) && zeroConfSetting !== 'none') {
      config[key] = 'none'
    }
  }, cryptoCodes)
  return settingsLoader.migrationSaveConfig(config)
}

exports.down = function (next) {
  next()
}
