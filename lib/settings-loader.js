const R = require('ramda')

const db = require('./db')

let settingsCache

function load () {
  return Promise.all([loadConfig(), loadAccounts()])
  .then(function ([config, accounts]) {
    settingsCache = {
      config,
      accounts
    }

    return settingsCache
  })
  .catch(err => {
    settingsCache = undefined
    throw err
  })
}

function loadConfig () {
  return db.oneOrNone('select data from user_config where type=$1', 'config')
  .then(row => row ? row.data.config : [])
}

function loadAccounts () {
  const toFields = fieldArr => R.fromPairs(R.map(r => [r.code, r.value], fieldArr))
  const toPairs = r => [r.code, toFields(r.fields)]

  return db.oneOrNone('select data from user_config where type=$1', 'accounts')
  .then(function (data) {
    if (!data) return {}
    return R.fromPairs(R.map(toPairs, data.data.accounts))
  })
}

function settings () {
  return settingsCache
}

module.exports = {
  settings,
  loadConfig,
  load
}
