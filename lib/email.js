// const configManager = require('./new-config-manager')
const logger = require('./logger')
const ph = require('./plugin-helper')

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      const pluginCode = 'mailgun'
      const account = ph.getAccountInstance(settings.accounts[pluginCode])
      const plugin = ph.load(ph.EMAIL, pluginCode, account?.enabled)

      return plugin.sendMessage(account, rec)
    })
}

module.exports = {sendMessage}
