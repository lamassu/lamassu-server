const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')

function sendMessage (rec) {
  return Promise.resolve()
  .then(() => {
    const settings = settingsLoader.settings()
    const pluginCode = configManager.unscoped(settings.config).extraServices.sms

    if (!pluginCode) throw new Error('No sms plugin defined')
    const account = settings.accounts[pluginCode]
    const plugin = require('lamassu-' + pluginCode)

    return plugin.sendMessage(account, rec)
  })
}

module.exports = {sendMessage}
