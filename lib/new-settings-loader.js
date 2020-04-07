const _ = require('lodash/fp')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const adapter = new FileAsync('db.json')
let db = null

low(adapter).then(it => {
  db = it
})

function replace (array, index, value) {
  return array.slice(0, index).concat([value]).concat(array.slice(index + 1))
}

function replaceOrAdd (accounts, account) {
  const index = _.findIndex(['code', account.code], accounts)
  return index !== -1 ? replace(accounts, index, account) : _.concat(accounts)(account)
}

function saveAccounts (accountsToSave) {
  const currentState = db.getState() || {}
  const accounts = currentState.accounts || []

  const newAccounts = _.reduce(replaceOrAdd)(accounts)(accountsToSave)

  const newState = _.set('accounts', newAccounts, currentState)
  db.setState(newState)
  return db.write()
    .then(() => newState.accounts)
}

function getAccounts () {
  const state = db.getState()
  return state ? state.accounts : null
}

function saveConfig (config) {
  const currentState = db.getState() || {}
  const currentConfig = currentState.config || {}
  const newConfig = _.assign(currentConfig, config)

  const newState = _.set('config', newConfig, currentState)
  db.setState(newState)
  return db.write()
    .then(() => newState.config)
}

function getConfig () {
  const state = db.getState()
  return (state && state.config) || {}
}

module.exports = { getConfig, saveConfig, saveAccounts, getAccounts }
