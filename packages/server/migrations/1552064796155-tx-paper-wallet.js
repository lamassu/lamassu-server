'use strict'

const db = require('./db')

exports.up = function (next) {
  var sql = [
    'ALTER TABLE cash_in_txs ADD COLUMN is_paper_wallet boolean null DEFAULT false',
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
