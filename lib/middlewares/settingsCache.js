const _ = require('lodash/fp')
const state = require('./state')

const getTimestamp = (operatorId) => state.settingsCache[operatorId] ? state.settingsCache[operatorId].timestamp : null

const getCache = (operatorId) => state.settingsCache[operatorId] ? state.settingsCache[operatorId].cache : null

const setTimestamp = (operatorId, newTimestamp) => {
  state.settingsCache = _.set([operatorId, 'timestamp'], newTimestamp, state.settingsCache)
}

const setCache = (operatorId, newCache) => {
  state.settingsCache = _.set([operatorId, 'cache'], newCache, state.settingsCache)
}

const clear = (operatorId) => {
  state.settingsCache = _.set([operatorId], null, state.settingsCache)
}

module.exports = {
  getTimestamp,
  getCache,
  setTimestamp,
  setCache,
  clear
}
