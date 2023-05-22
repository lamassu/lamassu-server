const pairing = require('../pairing')
const logger = require('../logger')

const { asyncLocalStorage, defaultStore } = require('../async-storage')
const { getOperatorFromToken } = require('../ultralight/queries')

function ca (req, res) {
  const store = defaultStore()
  const token = req.query.token

  asyncLocalStorage.run(store, async () => {
    try {
      const { schema } = await getOperatorFromToken(token)
      store.set('schema', schema)
      const ca = await pairing.authorizeCaDownload(token)
      res.json({ ca })
    } catch (err) {
      logger.error(err)
      return res.status(403).json({ error: 'forbidden' })
    }
  })
}

module.exports = ca
