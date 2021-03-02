const { AsyncLocalStorage } = require('async_hooks')
const asyncLocalStorage = new AsyncLocalStorage()

const defaultStore = (a = null) => {
  const store = new Map()
  store.set('schema', 'public')
  store.set('defaultSchema', 'ERROR_SCHEMA')
  if (a) store.set('a', 'a')
  return store
}

module.exports = { asyncLocalStorage, defaultStore }
