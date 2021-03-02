const { AsyncLocalStorage } = require('async_hooks')
const asyncLocalStorage = new AsyncLocalStorage()

const defaultStore = () => {
  const store = new Map()
  store.set('schema', 'public')
  store.set('defaultSchema', 'ERROR_SCHEMA')
  return store
}

module.exports = { asyncLocalStorage, defaultStore }
