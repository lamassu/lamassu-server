const fs = require('fs')
const express = require('express')
const router = express.Router()
const hkdf = require('futoin-hkdf')
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const mnemonicHelpers = require('../../mnemonic-helpers')
const db = require('../../db')
const options = require('../../options')
const { USER_SESSIONS_TABLE_NAME } = require('../../constants')

const getSecret = () => {
  const mnemonic = fs.readFileSync(options.mnemonicPath, 'utf8')
  return hkdf(
    mnemonicHelpers.toEntropyBuffer(mnemonic),
    16,
    { info: 'operator-id' }
  ).toString('hex')
}

const hostname = options.hostname

router.use('*', session({
  store: new PgSession({
    pgPromise: db,
    tableName: USER_SESSIONS_TABLE_NAME
  }),
  name: 'lamassu_sid',
  secret: getSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    domain: hostname,
    sameSite: true,
    maxAge: 60 * 10 * 1000 // 10 minutes
  }
}))

module.exports = router
