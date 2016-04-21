require('es6-promise').polyfill()
var fs = require('fs')
var pgp = require('pg-promise')()

function connect () {
  var psqlUrl
  try {
    psqlUrl = process.env.DATABASE_URL || JSON.parse(fs.readFileSync('/etc/lamassu.json')).postgresql
  } catch (ex) {
    psqlUrl = 'psql://lamassu:lamassu@localhost/lamassu'
  }
  return pgp(psqlUrl)
}

function loadConfig () {
  var db = connect()
  return db.one('select data from user_config where type=$1', 'exchanges')
  .then(function (data) {
    pgp.end()
    return data.data
  })
}

exports.loadConfig = loadConfig
