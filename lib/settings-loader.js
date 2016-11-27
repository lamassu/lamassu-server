const R = require('ramda')

const db = require('./db')

// Note: We won't prematurely optimize by caching yet
// This shouldn't really affect performance at these scales

function load () {
  return Promise.all([
    db.one('select data from user_config where type=$1', 'config'),
    loadAccounts()
  ])
  .then(function ([data, accounts]) {
    return {
      config: data.data,
      accounts: accounts
    }
  })
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
  return load()
}

function clear () {
  // Do nothing, since no caching
}

module.exports = {
  settings,
  clear
}
