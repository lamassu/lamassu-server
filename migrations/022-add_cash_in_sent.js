var db = require('./db')

exports.up = function (next) {
  var sql = [
    db.addColumn('cash_in_txs', 'send', 'boolean not null default false'),
    db.renameColumn('cash_in_txs', 'currency_code', 'fiat_code'),
    db.renameColumn('bills', 'currency_code', 'fiat_code'),
    db.renameColumn('bills', 'denomination', 'fiat'),
    db.dropColumn('bills', 'to_address'),
    db.dropColumn('bills', 'device_id'),
    db.renameColumn('cash_out_txs', 'currency_code', 'fiat_code')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
