const db = require('./db')
const migrateTools = require('./migrate-tools')

exports.up = function (next) {
  return migrateTools.migrateNames()
    .then(updateSql => {
      const sql = [
        'alter table devices add column name text',
        updateSql,
        'alter table devices alter column name set not null'
      ]

      return db.multi(sql, next)
    })
    .catch(() => {
      const sql = [
        'alter table devices add column name text',
        'alter table devices alter column name set not null'
      ]

      return db.multi(sql, next)
    })
}

exports.down = function (next) {
  const sql = ['alter table devices drop column name']
  db.multi(sql, next)
}
