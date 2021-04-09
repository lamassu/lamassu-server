const _ = require('lodash/fp')
var db = require('../lib/db')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

const stripl = _.curry((q, str) => _.startsWith(q, str) ? str.slice(q.length) : str)
const filter = namespace => _.pickBy((value, key) => _.startsWith(`${namespace}_`)(key))
const strip = key => _.mapKeys(stripl(`${key}_`))

const fromNamespace = _.curry((key, config) => _.compose(strip(key), filter(key))(config))

const split = _.curry(_.split)
const composed = _.compose(_.head, split('_'))

const getCryptoCodes = (config) => {
  const walletKeys = _.keys(fromNamespace('wallets', config))
  return _.uniq(_.map(composed, walletKeys))
}

exports.up = function (next) {
  db.tx(async t => {
    let min = Infinity
    const sp = settingsLoader.loadLatest()
    const mp = t.any('SELECT device_id FROM devices')
    const [{ config }, machines] = await Promise.all([sp, mp])
    const cryptoCodes = getCryptoCodes(config)

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
