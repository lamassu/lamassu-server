const _ = require('lodash/fp')

module.exports = {
  load,
  TICKER: 'ticker',
  EXCHANGE: 'exchange',
  WALLET: 'wallet',
  SMS: 'sms',
  EMAIL: 'email'
}

function load (type, pluginCode) {
  const me = module.exports
  if (!_.includes(type, [me.TICKER, me.EXCHANGE, me.WALLET, me.SMS, me.EMAIL])) {
    throw new Error(`Unallowed plugin type: ${type}`)
  }

  if (pluginCode.search(/[a-z0-9\-]/) === -1) {
    throw new Error(`Unallowed plugin name: ${pluginCode}`)
  }

  return require(`./plugins/${type}/${pluginCode}/${pluginCode}`)
}
