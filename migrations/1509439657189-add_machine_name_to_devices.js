const db = require('./db')
const migrateTools = require('./migrate-tools')

exports.up = function (next) {
  return migrateTools.migrateNames()
    .then(updateSql => {
      const sql = [
        db.addColumn('devices', 'name', 'text'),
        updateSql,
        db.alterColumn('devices', 'name', 'set not null')
      ]

      return db.multi(sql, next)
    })
    .catch(() => {
      const sql = [
        db.addColumn('devices', 'name', 'text'),
        db.alterColumn('devices', 'name', 'set not null')
      ]

      return db.multi(sql, next)
    })
}

exports.down = function (next) {
  const sql = [
    db.dropColumn('devices', 'name')
  ]
  db.multi(sql, next)
}
