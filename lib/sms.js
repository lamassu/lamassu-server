var Client = require('twilio')
var Config = require('./config')

var toNumber = process.argv[2]

Config.loadConfig()
.then(function (config) {
  var _config = config.exchanges.plugins.settings.sms
  var accountSid = _config.accountSid
  var authToken = _config.authToken
  var fromNumber = _config.fromNumber

  var client = Client(accountSid, authToken)
  client.messages.create({
    body: '[Lamassu] ALERT Stale screen: acceptingFirstBill',
    to: toNumber,
    from: fromNumber
  }, function (err, message) {
    console.log(err)
    console.log(message)
  })
})
