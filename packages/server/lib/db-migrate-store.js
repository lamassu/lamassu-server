const db = require('../lib/db')
const logger = require('./logger')

const upsert = 'insert into migrations (id, data) values (1, $1) on conflict (id) do update set data = $1'

function DbMigrateStore () {
}

DbMigrateStore.prototype.save = function (set, fn) {
  let insertData = JSON.stringify({
    lastRun: set.lastRun,
    migrations: set.migrations
  })
  db.none(upsert, [insertData]).then(fn).catch(logger.error)
}

DbMigrateStore.prototype.load = function (fn) {
  db.oneOrNone('select data from migrations').then(res => {
    fn(null, res?.data || {})
  })
}

module.exports = DbMigrateStore
