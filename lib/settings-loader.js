const _ = require('lodash/fp')

const db = require('./db')

let settingsCache

function load (versionId) {
  if (!versionId) throw new Error('versionId is required')

  return Promise.all([loadConfig(versionId), loadAccounts()])
  .then(([config, accounts]) => ({
    config,
    accounts
  }))
}

function loadLatest () {
  return Promise.all([loadLatestConfig(), loadAccounts()])
  .then(([config, accounts]) => ({
    config,
    accounts
  }))
}

function loadConfig (versionId) {
  const sql = `select data
  from user_config
  where id=$1 and type=$2`

  return db.oneOrNone(sql, [versionId, 'config'])
  .then(row => row ? row.data.config : [])
}

function loadLatestConfig () {
  const sql = `select data
  from user_config
  where type=$1
  order by id desc
  limit 1`

  return db.oneOrNone(sql, ['config'])
  .then(row => row ? row.data.config : [])
}

function loadAccounts () {
  const toFields = fieldArr => _.fromPairs(_.map(r => [r.code, r.value], fieldArr))
  const toPairs = r => [r.code, toFields(r.fields)]

  return db.oneOrNone('select data from user_config where type=$1', 'accounts')
  .then(function (data) {
    if (!data) return {}
    return _.fromPairs(_.map(toPairs, data.data.accounts))
  })
}

function settings () {
  return settingsCache
}

function save (config) {
  const sql = 'insert into user_config (type, data) values ($1, $2)'
  return db.none(sql, ['config', config])
}

module.exports = {
  settings,
  loadConfig,
  load,
  loadLatest,
  save
}
