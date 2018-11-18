const path = require('path')
const migrate = require('migrate')

const DbMigrateStore = require('./db-migrate-store')

const migrateDir = path.resolve(__dirname, '..', 'migrations')
const migrateOpts = {
  migrationsDirectory: migrateDir,
  stateStore: new DbMigrateStore(),
  filterFunction: it => it.match(/^\d+.*\.js$/)
}

module.exports = { run }
function run () {
  return new Promise((resolve, reject) => {
    migrate.load(migrateOpts, (err, set) => {
      if (err) return reject(err)
      set.up(err => {
        if (err) return reject(err)
        return resolve(0)
      })
    })
  })
}
