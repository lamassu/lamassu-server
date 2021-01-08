const state = require('./state')

const getTimestamp = () => state.settingsCache.timestamp

const getCache = () => state.settingsCache.cache

const setTimestamp = (newTimestamp) => state.settingsCache.timestamp = newTimestamp

const setCache = (newCache) => state.settingsCache.cache = newCache

const clearCache = () => state.settingsCache.cache = null

module.exports = {
  getTimestamp,
  getCache,
  setTimestamp,
  setCache,
  clearCache
}