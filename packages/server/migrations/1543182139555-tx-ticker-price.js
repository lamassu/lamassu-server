'use strict'

const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE cash_in_txs ADD COLUMN raw_ticker_price numeric(14, 5) null DEFAULT null',
    'ALTER TABLE cash_out_txs ADD COLUMN raw_ticker_price numeric(14, 5) null DEFAULT null'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
