const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      const pluginCode = argv.mockSms ? 'mock-sms' : 'twilio'
      const plugin = ph.load(ph.SMS, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.sendMessage(account, rec)
    })
}

function getLookup (settings, number) {
  return Promise.resolve()
    .then(() => {
      const pluginCode = argv.mockSms ? 'mock-sms' : 'twilio'
      const plugin = ph.load(ph.SMS, pluginCode)
      const account = settings.accounts[pluginCode]

      return plugin.getLookup(account, number)
    })
}

module.exports = { sendMessage, getLookup }
