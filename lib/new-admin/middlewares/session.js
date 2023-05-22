const express = require('express')
const router = express.Router()
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const db = require('../../db')
const { USER_SESSIONS_TABLE_NAME } = require('../../constants')

router.use('*', (req, res, next) => {
  return session({
    store: new PgSession({
      pgPromise: db,
      tableName: USER_SESSIONS_TABLE_NAME
    }),
    name: 'lamassu_sid',
    secret: res.locals.operatorId ?? 'public', // TODO: 'public' is a generic secret to non-logged in users
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 60 * 10 * 1000 // 10 minutes
    }
  })(req, res, next)
})

module.exports = router
