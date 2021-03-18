const crypto = require('crypto')

const constants = require('./constants')
const db = require('./db')

function createAuthToken (userID, type) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO auth_tokens (token, type, user_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, type) DO UPDATE SET token=$1, expire=now() + interval '${constants.AUTH_TOKEN_EXPIRATION_TIME}' RETURNING *`

  return db.$one(sql, [token, type, userID])
}

module.exports = {
  createAuthToken
}
