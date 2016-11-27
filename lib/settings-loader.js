const R = require('ramda')

const db = require('./db')

let settings

function load () {
  return Promise.all([
    db.one('select data from user_config where type=$1', 'config'),
    loadAccounts()
  ])
  .then(function ([data, accounts]) {
    settings = {
      config: data.data,
      accounts: accounts
    }

    return settings
  })
  .catch(err => {
    settings = undefined
    throw err
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

module.exports = {
  settings,
  load
}
