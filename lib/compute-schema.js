const { asyncLocalStorage } = require('./async-storage')

const computeSchema = (req, res, next) => {
  const store = new Map()
  store.set('schema', 'public')
  store.set('defaultSchema', 'ERROR_SCHEMA')
  asyncLocalStorage.run(store, () => {
    next()
  })
}

module.exports = computeSchema
