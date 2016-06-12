var pgp = require('pg-promise')()
var psqlUrl = require('../lib/options').postgres

function connect () {
  return pgp(psqlUrl)
}
exports.connect = connect

function loadConfig () {
  var db = connect()
  return db.one('select data from user_config where type=$1', 'exchanges')
  .then(function (data) {
    pgp.end()
    return data.data
  })
}
exports.loadConfig = loadConfig
