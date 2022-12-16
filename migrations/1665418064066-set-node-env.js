const fs = require('fs')
const path = require('path')

const migrateEnv = require('../tools/migrate-env')

exports.up = function (next) {
  try {
    // NODE_ENV defaults to undefined on some environments, best to check the existence of the production environment file
    migrateEnv([
      ['NODE_ENV', fs.existsSync(path.resolve('/etc', 'lamassu', '.env')) ? 'production' : 'development']
    ])
  } finally {
    next()
  }
}

exports.down = function (next) {
  next()
}
