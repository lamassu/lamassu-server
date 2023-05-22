const base64 = require('base-64')

const { asyncLocalStorage } = require('../../async-storage')
const { getSchemaFromIdentifier } = require('../../ultralight/queries')


const computeSchema = (req, res, next) => {
  const pazuzCookie = req.cookies.pazuz_operatoridentifier ?? null
  const pazuzHeader = req.headers['pazuz-operator-identifier'] ?? null
  const identifier = (pazuzHeader && base64.decode(pazuzHeader)) ?? (pazuzCookie && base64.decode(pazuzCookie))
  const store = asyncLocalStorage.getStore()
  return asyncLocalStorage.run(store, () => {
    return getSchemaFromIdentifier(identifier)
      .then(res => {
        store.set('schema', res)
        next()
      })
      .catch(e => next(e))
  })
}

module.exports = computeSchema