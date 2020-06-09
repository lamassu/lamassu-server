// const configManager = require('./new-config-manager')
const logger = require('./logger')
const ph = require('./plugin-helper')

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      // TODO new-admin
      // const pluginCode = configManager.unscoped(settings.config).email
      const pluginCode = 'mailgun'
      const plugin = ph.load(ph.EMAIL, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.sendMessage(account, rec)
    })
}

module.exports = {sendMessage}
