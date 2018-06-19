require('es6-promise').polyfill()

var config = require('../lib/settings-loader')
var sms = require('../lib/sms')

var rand = Math.floor(Math.random() * 1e6)
var db = config.connection
var rec = {
  email: {
    subject: 'Test email ' + rand,
    body: 'This is a test email from lamassu-server'
  },
  sms: {
    toNumber: '666',
    body: '[Lamassu] This is a test sms ' + rand
  }
}

config.loadLatest(db)
  .then(function (config) {
    sms.sendMessage(config, rec)
      .then(function () {
        console.log('Success.')
        process.exit(0)
      })
      .catch(function (err) {
        console.log(err.stack)
        process.exit(1)
      })
  })
