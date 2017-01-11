const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const pify = require('pify')

const db = require('./db')
const schema = require('../lamassu-schema.json')

const mapWithKey = _.map.convert({cap: false})

let settingsCache

function expandFixture (fixture) {
  const deviceId = argv.machine

  function findField (code) {
    const field = _.find(_.matchesProperty('code', code), schema.fields)
    const group = _.find(group => _.includes(code, group.fields), schema.groups)

    return _.merge({cryptoScope: group.cryptoScope, machineScope: group.machineScope}, field)
  }

  function expand (value, code) {
    const field = findField(code)

    const machine = field.machineScope === 'global'
    ? 'global'
    : deviceId

    const crypto = field.cryptoScope === 'global'
    ? 'global'
    : 'BTC'

    return {
      fieldLocator: {
        fieldScope: {crypto, machine},
        code,
        fieldType: field.fieldType,
        fieldClass: field.fieldClass
      },
      fieldValue: {
        fieldType: field.fieldType,
        value
      }
    }
  }

  return mapWithKey(expand, fixture)
}

function loadFixture () {
  const fixture = argv.fixture
  const deviceId = argv.machine

  if (fixture && !deviceId) throw new Error('Missing --machine parameter for --fixture')

  const fixturePath = fixture => path.resolve(__dirname, '..', 'test', 'fixtures', fixture + '.json')

  const promise = fixture
  ? pify(fs.readFile)(fixturePath(fixture)).then(JSON.parse)
  : Promise.resolve([])

  return promise
  .then(_.map(expandFixture))
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
  const sql = `select data
  from user_config
  where id=$1 and type=$2`

  return Promise.all([db.oneOrNone(sql, [versionId, 'config']), loadFixture()])
  .then(([row, fixture]) => {
    const config = row ? row.data.config : []
    return mergeValues(config, fixture)
  })
}

function loadLatestConfig () {
  const sql = `select data
  from user_config
  where type=$1
  order by id desc
  limit 1`

  return Promise.all([db.oneOrNone(sql, ['config']), loadFixture()])
  .then(([row, fixture]) => {
    const config = row ? row.data.config : []
    require('./pp')(fixture)
    return mergeValues(config, fixture)
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
