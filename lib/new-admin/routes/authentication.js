const express = require('express')
const router = express.Router()

const login = require('../modules/login')
const options = require('../../options')
const T = require('../../time')

const NEVER = new Date(Date.now() + 100 * T.years)
const hostname = options.hostname

const register = (req, res, next) => {
  const otp = req.query.otp
  const ua = req.headers['user-agent']
  const ip = req.ip

  if (!otp) return next()

  return login.register(otp, ua, ip)
    .then(r => {
      if (r.expired) return res.status(401).send('OTP expired, generate new registration link')

      // Maybe user is using old registration key, attempt to authenticate
      if (!r.success) return next()

      const cookieOpts = {
        httpOnly: true,
        secure: true,
        domain: hostname,
        sameSite: true,
        expires: NEVER
      }

      const token = r.token
      req.token = token
      res.cookie('token', token, cookieOpts)
      res.sendStatus(200)
    })
}

router.get('/register', register)

module.exports = router
