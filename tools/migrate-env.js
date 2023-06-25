const fs = require('fs')
const path = require('path')

const _ = require('lodash/fp')
const setEnvVariable = require('./set-env-var')

const ENV_PATH = process.env.NODE_ENV === 'production' ? path.resolve('/etc', 'lamassu', '.env') : path.resolve(__dirname, '../.env')
const BACKUP_TIMESTAMP = Date.now()
const BACKUP_PATH = `${ENV_PATH}-${BACKUP_TIMESTAMP}`

const migrateEnv = newVars => {
  try {
    fs.copyFileSync(ENV_PATH, BACKUP_PATH)
    _.forEach(it => {
      setEnvVariable(it[0], it[1], { ENV_PATH })
    }, newVars)
    fs.unlinkSync(BACKUP_PATH)
    console.log('Environment migration successful')
  } catch (e) {
    // Rollback the migration and restore the backup file
    if (fs.existsSync(BACKUP_PATH)) {
      console.log('Rolling back the environment migration...')
      fs.copyFileSync(BACKUP_PATH, ENV_PATH)
      fs.unlinkSync(BACKUP_PATH)
      console.log('Rollback finished')
    }
    console.log('Environment migration failed')
    throw e
  }
}

module.exports = migrateEnv
