const db = require('./db')

function getOperatorId () {
  const sql = `SELECT id FROM operator_ids WHERE description = 'mnemonic'`
  return db.oneOrNone(sql)
}

module.exports = { getOperatorId }
