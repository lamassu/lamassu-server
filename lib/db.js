const pgp = require('pg-promise')()
const psqlUrl = require('../lib/options').postgresql

module.exports = {db: pgp(psqlUrl)}
