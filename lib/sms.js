var accountSid = 'AC5b08587439d5e0adb5132d133941ab76'
var authToken = 'b4acf1212c0271d852706d17711e9670'
var client = require('twilio')(accountSid, authToken)

client.messages.create({
  body: '[Lamassu] ALERT Stale screen: acceptingFirstBill',
  to: '+359899948650',
  from: '+16035383222'
}, function (err, message) {
  console.log(err)
  console.log(message)
})
