'use strict'

var Bunyan = require('bunyan')
var async = require('async')

var logLevel = process.env.LAMASSU_ENV === 'debug'
? 'debug'
: 'info'

var bunyan = Bunyan.createLogger({name: 'lamassu-server', level: logLevel})

// log version
var version = require('../package.json').version
bunyan.info('Version: %s', version)

// log git stuff (optional)
// `git-rev` omits `err` param in callback, without this wrapper
// `async` interprets returned values as errors.
function wrapper (fn, cb) {
  fn(function (value) {
    cb(null, value)
  })
}
try {
  var git = require('git-rev')

  async.parallel([
    async.apply(wrapper, git.branch),
    async.apply(wrapper, git.short)
  ],
    function (err, values) {
      if (err) return bunyan.error(err)
      bunyan.info('Git: #%s @%s', values[0], values[1])
    })
} catch (_) {}

module.exports = bunyan
