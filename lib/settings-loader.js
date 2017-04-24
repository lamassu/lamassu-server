const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const pify = require('pify')

const db = require('./db')
const configValidate = require('./config-validate')

let settingsCache

function loadFixture () {
  const fixture = argv.fixture
  const machine = argv.machine

  if (fixture && !machine) throw new Error('Missing --machine parameter for --fixture')

  const fixturePath = fixture => path.resolve(__dirname, '..', 'test', 'fixtures', fixture + '.json')

  const promise = fixture
  ? pify(fs.readFile)(fixturePath(fixture)).then(JSON.parse)
  : Promise.resolve([])

  return promise
  .then(values => _.map(v => {
    return (v.fieldLocator.fieldScope.machine === 'machine')
    ? _.set('fieldLocator.fieldScope.machine', machine, v)
    : v
  }, values))
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
  if (argv.fixture) return loadFixture()

  const sql = `select data
  from user_config
  where id=$1 and type=$2
  and valid`

  return db.one(sql, [versionId, 'config'])
  .then(row => row.data.config)
  .then(configValidate.validate)
  .catch(err => {
    if (err.name === 'QueryResultError') {
      throw new Error('No such config version: ' + versionId)
    }

    throw err
  })
}

function loadLatestConfig () {
  if (argv.fixture) return loadFixture()

  const sql = `select id, valid, data
  from user_config
  where type=$1
  and valid
  order by id desc
  limit 1`

  return db.one(sql, ['config'])
  .then(row => row.data.config)
  .then(configValidate.validate)
  .catch(err => {
    if (err.name === 'QueryResultError') {
      throw new Error('lamassu-server is not configured')
    }

    throw err
  })
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
  const sql = 'insert into user_config (type, data, valid) values ($1, $2, $3)'

  return configValidate.validate(config)
  .then(() => db.none(sql, ['config', {config}, true]))
  .catch(() => db.none(sql, ['config', {config}, false]))
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
