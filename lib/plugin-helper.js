const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')

const pluginCodes = {
  TICKER: 'ticker',
  EXCHANGE: 'exchange',
  WALLET: 'wallet',
  WALLET_SCORING: 'wallet-scoring',
  LAYER2: 'layer2',
  SMS: 'sms',
  EMAIL: 'email',
  ZERO_CONF: 'zero-conf',
  COMPLIANCE: 'compliance'
}

module.exports = _.assign({ load, getAccountInstance }, pluginCodes)

function getAccountInstance (plugin, code) {
  if (!plugin) return

  const instances = plugin?.instances ?? []
  const activeInstances = _.filter(it => it.enabled, instances)

  if (_.isEmpty(activeInstances)) {
    throw new Error(`No active service configuration for plugin '${code}'. Please check your 3rd party services options`)
  }

  if (_.size(activeInstances) > 1) {
    throw new Error(`Plugin '${code}' has two or more active instances. Please make sure only a single instance is active at any given time`)
  }

  return { ...activeInstances[0], code }
}

function load (type, pluginCode, isEnabled = true) {
  if (!_.includes(type, _.values(pluginCodes))) {
    throw new Error(`Unallowed plugin type: ${type}`)
  }

  if (!pluginCode) throw new Error(`No plugin defined for ${type}`)

  if (pluginCode.search(/[a-z0-9-]/) === -1) {
    throw new Error(`Unallowed plugin name: ${pluginCode}`)
  }

  if (!isEnabled) throw new Error(`Plugin '${pluginCode}' is disabled. Please check your 3rd party services options`)

  return require(`./plugins/${type}/${pluginCode}/${pluginCode}`)
}
