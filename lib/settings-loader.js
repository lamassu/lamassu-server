const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const pify = require('pify')

const pgp = require('pg-promise')()
const db = require('./db')
const configValidate = require('./config-validate')
const schema = require('../lamassu-schema.json')

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
  return _.reject(r => _.isNil(r.fieldValue), _.unionWith(isEquivalentField, b, a))
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

function loadRecentConfig () {
  if (argv.fixture) return loadFixture()

  const sql = `select id, data
  from user_config
  where type=$1
  order by id desc
  limit 1`

  return db.one(sql, ['config'])
  .then(row => row.data.config)
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

  console.log('DEBUG800: %s', sql)

  return configValidate.validate(config)
  .then(() => db.none(sql, ['config', {config}, true]))
  .catch(() => db.none(sql, ['config', {config}, false]))
}

function configAddField (scope, fieldCode, fieldType, fieldClass, value) {
  return {
    fieldLocator: {
      fieldScope: {
        crypto: scope.crypto,
        machine: scope.machine
      },
      code: fieldCode,
      fieldType,
      fieldClass
    },
    fieldValue: {fieldType, value}
  }
}

function configDeleteField (scope, fieldCode) {
  return {
    fieldLocator: {
      fieldScope: {
        crypto: scope.crypto,
        machine: scope.machine
      },
      code: fieldCode
    },
    fieldValue: null
  }
}

function populateScopes (schema) {
  const scopeLookup = {}
  _.forEach(r => {
    const scope = {
      cryptoScope: r.cryptoScope,
      machineScope: r.machineScope
    }

    _.forEach(field => { scopeLookup[field] = scope }, r.fields)
  }, schema.groups)

  return _.map(r => _.assign(scopeLookup[r.code], r), schema.fields)
}

function cryptoCodeDefaults (schema, cryptoCode) {
  const scope = {crypto: cryptoCode, machine: 'global'}

  const schemaEntries = populateScopes(schema)
  const hasCryptoSpecificDefault = r => r.cryptoScope === 'specific' && !_.isNil(r.default)
  const cryptoSpecificFields = _.filter(hasCryptoSpecificDefault, schemaEntries)

  return _.map(r => {
    return configAddField(scope, r.code, r.fieldType, r.fieldClass, r.default)
  }, cryptoSpecificFields)
}

function addCryptoDefaults (oldConfig, newFields) {
  const cryptoCodeEntries = _.filter(v => v.fieldLocator.code === 'cryptoCurrencies', newFields)
  const cryptoCodes = _.map(v => v.fieldValue.value, cryptoCodeEntries)
  const uniqueCryptoCodes = _.uniq(_.flatten(cryptoCodes))

  const mapDefaults = cryptoCode => cryptoCodeDefaults(schema, cryptoCode)
  const defaults = _.flatten(_.map(mapDefaults, uniqueCryptoCodes))

  return mergeValues(defaults, oldConfig)
}

function modifyConfig (newFields) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    return loadRecentConfig()
    .then(oldConfig => {
      const oldConfigWithDefaults = addCryptoDefaults(oldConfig, newFields)
      const doSave = _.flow(mergeValues, save)
      return doSave(oldConfigWithDefaults, newFields)
    })
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
}

module.exports = {
  settings,
  loadConfig,
  loadRecentConfig,
  load,
  loadLatest,
  save,
  loadFixture,
  mergeValues,
  modifyConfig,
  configAddField,
  configDeleteField
}
