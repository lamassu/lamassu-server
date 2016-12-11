const configManager = require('./config-manager')

function sendMessage (settings, rec) {
  return Promise.resolve()
  .then(() => {
    const pluginCode = configManager.unscoped(settings.config).email

    if (!pluginCode) throw new Error('No email plugin defined')
    const account = settings.accounts[pluginCode]
    const plugin = require('lamassu-' + pluginCode)

    return plugin.sendMessage(account, rec)
  })
}

module.exports = {sendMessage}
