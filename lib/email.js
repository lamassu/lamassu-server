const ph = require('./plugin-helper')

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      const pluginCode = settings.config.notifications_thirdParty_email
      const plugin = ph.load(ph.EMAIL, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.sendMessage(account, rec)
    })
}

function sendCustomerMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      const pluginCode = settings.config.notifications_thirdParty_email
      const plugin = ph.load(ph.EMAIL, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.sendMessage(account, rec)
    })
}

module.exports = {sendMessage, sendCustomerMessage}
