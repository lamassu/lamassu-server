const base64 = require('base-64')
const { getOperatorIdFromIdentifier } = require('../../ultralight/queries')

const findOperatorId = (req, res, next) => {
  const pazuzCookie = req.cookies.pazuz_operatoridentifier ?? null
  const pazuzHeader = req.headers['pazuz-operator-identifier'] ?? null
  const identifier = (pazuzHeader && base64.decode(pazuzHeader)) ?? (pazuzCookie && base64.decode(pazuzCookie))
  return getOperatorIdFromIdentifier(identifier)
    .then(id => {
      res.locals.operatorId = id
      return next()
    })
    .catch(e => next(e))
}

module.exports = findOperatorId

