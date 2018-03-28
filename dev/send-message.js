require('es6-promise').polyfill()

var config = require('../lib/config')
var plugins = require('../lib/plugins')

var rand = Math.floor(Math.random() * 1e6)

var rec = {
  email: {
    subject: 'Test email ' + rand,
    body: 'This is a test email from lamassu-server'
  },
  sms: {
    body: '[Lamassu] This is a test sms ' + rand
  }
}

var db = config.connection
config.loadConfig(db)
  .then(function (config) {
    plugins.configure(config)
    plugins.sendMessage(rec)
      .then(function () {
        console.log('Success.')
      })
      .catch(function (err) {
        console.log(err.stack)
      })
  })
