const express = require('express')
const router = express.Router()
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const db = require('../../db')
const options = require('../../options')
const { USER_SESSIONS_TABLE_NAME } = require('../../constants')
const { getOperatorId } = require('../../operator')

const hostname = options.hostname

router.use('*', async () => {
  return getOperatorId('authentication').then(secret => session({
    store: new PgSession({
      pgPromise: db,
      tableName: USER_SESSIONS_TABLE_NAME
    }),
    name: 'lamassu_sid',
    secret: secret,
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
})

module.exports = router
