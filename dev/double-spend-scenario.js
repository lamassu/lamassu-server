var db = require('../lib/postgresql_interface')
var connectionString = 'postgres://lamassu:lamassu@localhost/lamassu'
db.init(connectionString)

var session = {
  id: '6ede611c-cd03-11e5-88ee-2b5fcfdb0bc2',
  fingerprint: 'xx:xx'
}
var tx = {
  fiat: 40,
  satoshis: 6980000,
  toAddress: '1xxx',
  currencyCode: 'CAD',
  incoming: false
}

var tx2 = {
  fiat: 0,
  satoshis: 6980000,
  toAddress: '1xxx',
  currencyCode: 'CAD',
  incoming: false
}

db.addOutgoingTx(session, tx, function (err, res) {
  console.log('DEBUG1')
  console.log(err)
  console.log(res)
})

db.addOutgoingTx(session, tx2, function (err, res) {
  console.log('DEBUG2')
  console.log(err)
  console.log(res)
})

/*
setTimeout(function () {
  db.addOutgoingTx(session, tx2, function (err, res) {
    console.log('DEBUG2')
    console.log(err)
    console.log(res)
  })
}, 0)
*/

var bills = {
  uuid: 'c630338c-cd03-11e5-a9df-dbc9be2e9fbb',
  currency: 'CAD',
  toAddress: '1xxx',
  deviceTime: Date.now(),
  satoshis: 6980000,
  fiat: 40
}

/*
db.recordBill(session, bills, function (err) {
  console.log(err)
})
*/
