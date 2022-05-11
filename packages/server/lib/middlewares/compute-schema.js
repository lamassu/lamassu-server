const { asyncLocalStorage, defaultStore } = require('../async-storage')

const computeSchema = (req, res, next) => {
  const store = defaultStore()
  asyncLocalStorage.run(store, () => {
    next()
  })
}

module.exports = computeSchema
