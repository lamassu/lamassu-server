require('es6-promise').polyfill()

var fs = require('fs')
var notifier = require('../lib/notifier')
var db = require('../lib/postgresql_interface')

function getBalances () {
  return [
    {fiatBalance: 23.2345, fiatCode: 'USD', cryptoCode: 'BTC'},
    {fiatBalance: 23, fiatCode: 'USD', cryptoCode: 'ETH'}
  ]
}

var psqlUrl
try {
  psqlUrl = process.env.DATABASE_URL || JSON.parse(fs.readFileSync('/etc/lamassu.json')).postgresql
} catch (ex) {
  psqlUrl = 'psql://lamassu:lamassu@localhost/lamassu'
}

db.init(psqlUrl)
notifier.init(db, getBalances, {lowBalanceThreshold: 10})
console.log('DEBUG0')
notifier.checkStatus()
.then(function (alertRec) {
  console.log('DEBUG1')
  console.log('%j', alertRec)
  var subject = notifier.alertSubject(alertRec)
  console.log(subject)
  var body = notifier.printEmailAlerts(alertRec)
  console.log(body)
  console.log(notifier.alertFingerprint(alertRec))
  process.exit(0)
})
.catch(function (err) {
  console.log(err.stack)
  process.exit(1)
})
