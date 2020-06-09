// const configManager = require('./config-manager')
const ph = require('./plugin-helper')

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      // TODO new-admin: how to load mock here? Only on dev?
      // const pluginCode = configManager.unscoped(settings.config).sms
      const pluginCode = 'twilio'
      const plugin = ph.load(ph.SMS, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.sendMessage(account, rec)
    })
}

module.exports = {sendMessage}
