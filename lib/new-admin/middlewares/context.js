const users = require('../../users')

const buildApolloContext = async ({ req, res }) => {
  if (!req.session.user) return { req, res }

  const user = await users.verifyAndUpdateUser(
    req.session.user.id,
    req.headers['user-agent'] || 'Unknown',
    req.ip
  )
  if (!user || !user.enabled) throw new AuthenticationError('Authentication failed')

  req.session.ua = req.headers['user-agent'] || 'Unknown'
  req.session.ipAddress = req.ip
  req.session.lastUsed = new Date(Date.now()).toISOString()
  req.session.user.id = user.id
  req.session.user.username = user.username
  req.session.user.role = user.role


  res.set('role', user.role)
  res.cookie('email', user.username)
  res.set('Access-Control-Expose-Headers', 'role')

  return { req, res }
}

module.exports = buildApolloContext
