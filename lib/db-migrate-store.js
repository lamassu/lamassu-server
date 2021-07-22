const db = require('../lib/db')

const upsert = 'insert into migrations (id, data) values (1, $1) on conflict (id) do update set data = $1'

function DbMigrateStore () {
}

DbMigrateStore.prototype.save = function (set, fn) {
  let insertData = JSON.stringify({
    lastRun: set.lastRun,
    migrations: set.migrations
  })
  db.none(upsert, [insertData]).then(fn).catch(err => console.log(err))
}

DbMigrateStore.prototype.load = function (fn) {
  db.one('select data from migrations').then(({ data }) => {
    fn(null, data)
  })
}

module.exports = DbMigrateStore
