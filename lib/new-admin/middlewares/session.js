const fs = require('fs')
const express = require('express')
const router = express.Router()
const hkdf = require('futoin-hkdf')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const mnemonicHelpers = require('../../mnemonic-helpers')
const db = require('../../db')
const options = require('../../options')

const getSecret = () => {
  const mnemonic = fs.readFileSync(options.mnemonicPath, 'utf8')
  return hkdf(
    mnemonicHelpers.toEntropyBuffer(mnemonic),
    16,
    { salt: 'lamassu-server-salt', info: 'operator-id' }
  ).toString('hex')
}

const hostname = options.hostname

router.use('*', session({
  store: new pgSession({
    pgPromise: db,
    tableName: 'user_sessions'
  }),
  name: 'lid',
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
