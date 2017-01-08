const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const pify = require('pify')

const db = require('./db')

let settingsCache

function loadFixture () {
  const fixture = argv.fixture
  const fixturePath = fixture => path.resolve(__dirname, '..', 'test', 'fixtures', fixture + '.json')

  return fixture
  ? pify(fs.readFile)(fixturePath(fixture)).then(JSON.parse)
  : Promise.resolve({})
}

function isEquivalentField (a, b) {
  return _.isEqual(
    [a.fieldLocator.code, a.fieldLocator.fieldScope],
    [b.fieldLocator.code, b.fieldLocator.fieldScope]
  )
}

// b overrides a
function mergeValues (a, b) {
  return _.unionWith(isEquivalentField, b, a)
}

function load (versionId) {
  if (!versionId) throw new Error('versionId is required')

  return Promise.all([loadConfig(versionId), loadAccounts(), loadFixture()])
  .then(([config, accounts, fixture]) => ({
    config: mergeValues(config, fixture),
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
  save,
  loadFixture,
  mergeValues
}
