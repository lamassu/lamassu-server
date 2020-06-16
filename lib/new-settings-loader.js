const _ = require('lodash/fp')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const adapter = new FileAsync('db.json')
let db = null

// TODO new-admin save to actual db, like the old settings
low(adapter).then(it => {
  db = it
})

function saveAccounts (accountsToSave) {
  const currentState = db.getState() || {}
  const accounts = currentState.accounts || {}

  const newAccounts = _.assign(accounts)(accountsToSave)

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

function loadLatest () {
  return new Promise((resolve) => {
    if (!db) {
      setTimeout(() => {
        return resolve(db.getState())
      }, 1000)
    } else {
      return resolve(db.getState())
    }
  })
}

// TODO new-admin: grab correct version
function load (versionId) {
  return new Promise((resolve) => {
    if (!db) {
      setTimeout(() => {
        return resolve(db.getState())
      }, 1000)
    } else {
      return resolve(db.getState())
    }
  })
}

module.exports = { getConfig, saveConfig, saveAccounts, getAccounts, loadLatest, load }
