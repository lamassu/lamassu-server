const crypto = require('crypto')

const browserOS = require('../../new-lamassu-admin/src/utils/browser-os')
const db = require('../db')

function generateOTP (name) {
  const otp = crypto.randomBytes(32).toString('hex')

  const sql = 'insert into one_time_passes (token, name) values ($1, $2)'

  return db.none(sql, [otp, name])
    .then(() => otp)
}

function validateOTP (otp) {
  const sql = `delete from one_time_passes
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`

  return db.one(sql, [otp])
    .then(r => ({ success: !r.expired, expired: r.expired, name: r.name }))
    .catch(() => ({ success: false, expired: false }))
}

function register (req) {
  const otp = req.query.otp
  
  return validateOTP(otp)
    .then(r => {
      if (!r.success) return r

      const deviceInfo = browserOS.getInformation(req.headers['user-agent'])
      const token = crypto.randomBytes(32).toString('hex')
      const sql = 'insert into user_tokens (token, name, browser_version, os_version, ip_address) values ($1, $2, $3, $4, $5)'

      return db.none(sql, [token, r.name, deviceInfo.browser, deviceInfo.OS, browserOS.getRequestIP(req)])
        .then(() => ({ success: true, token: token }))
    })
    .catch(() => ({ success: false, expired: false }))
}

function authenticate (token) {
  const sql = 'select token from user_tokens where token=$1'

  return db.one(sql, [token]).then(() => true).catch(() => false)
}

module.exports = {
  generateOTP,
  register,
  authenticate
}
