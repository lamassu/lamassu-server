const path = require('path')
const migrate = require('migrate')

const options = require('./options')

const migrateDir = path.resolve(__dirname, '..', 'migrations')
const migration = migrate.load(options.migrateStatePath, migrateDir)

module.exports = {run}

function run () {
  return new Promise((resolve, reject) => {
    migration.up(err => {
      if (err) return reject(err)
      return resolve(0)
    })
  })
}

