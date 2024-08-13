const crypto = require('crypto')

const _ = require('lodash/fp')
const db = require('./db')
const migration = require('./config-migration')
const { asyncLocalStorage } = require('./async-storage')
const { getOperatorId } = require('./operator')
const { getTermsConditions, setTermsConditions } = require('./new-config-manager')

const OLD_SETTINGS_LOADER_SCHEMA_VERSION = 1
const NEW_SETTINGS_LOADER_SCHEMA_VERSION = 2
const PASSWORD_FILLED = 'PASSWORD_FILLED'
const SECRET_FIELDS = [
  'bitgo.BTCWalletPassphrase',
  'bitgo.LTCWalletPassphrase',
  'bitgo.ZECWalletPassphrase',
  'bitgo.BCHWalletPassphrase',
  'bitgo.DASHWalletPassphrase',
  'bitstamp.secret',
  'itbit.clientSecret',
  'kraken.privateKey',
  'binanceus.privateKey',
  'cex.privateKey',
  'binance.privateKey',
  'twilio.authToken',
  'telnyx.apiKey',
  'vonage.apiSecret',
  'inforu.apiKey',
  'galoy.walletId',
  'galoy.apiSecret',
  'bitfinex.secret',
  'sumsub.apiToken',
  'sumsub.privateKey'
]

/*
 * JSON.stringify isn't necessarily deterministic so this function may compute
 * different hashes for the same object.
 */
const md5hash = text =>
  crypto
    .createHash('MD5')
    .update(text)
    .digest('hex')

const addTermsHash = configs => {
  const terms = _.omit(['hash'], getTermsConditions(configs))
  return !terms?.text ?
    configs :
    _.flow(
      _.get('text'),
      md5hash,
      hash => _.set('hash', hash, terms),
      setTermsConditions,
      _.assign(configs),
    )(terms)
}

const accountsSql = `update user_config set data = $2, valid = $3, schema_version = $4 where type = $1;
insert into user_config (type, data, valid, schema_version)
select $1, $2, $3, $4 where $1 not in (select type from user_config)`
function saveAccounts (accounts) {
  return Promise.all([loadAccounts(), getOperatorId('middleware')])
    .then(([currentAccounts, operatorId]) => {
      const newAccounts = _.merge(currentAccounts, accounts)
      return db.tx(t => {
        return t.none(accountsSql, ['accounts', { accounts: newAccounts }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
          .then(() => t.none('NOTIFY $1:name, $2', ['reload', JSON.stringify({ schema: asyncLocalStorage.getStore().get('schema'), operatorId })]))
      }).catch(console.error)
    })
}
function resetAccounts (schemaVersion) {
  return db.none(
    accountsSql,
    [
      'accounts',
      { accounts: NEW_SETTINGS_LOADER_SCHEMA_VERSION ? {} : [] },
      true,
      schemaVersion
    ]
  )
}

function loadAccounts (schemaVersion) {
  const sql = `select data
  from user_config
  where type=$1
  and schema_version=$2
  and valid
  order by id desc
  limit 1`

  return db.oneOrNone(sql, ['accounts', schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(_.compose(_.defaultTo({}), _.get('data.accounts')))
}

function showAccounts (schemaVersion) {
  return loadAccounts(schemaVersion)
    .then(accounts => {
      const filledSecretPaths = _.compact(_.map(path => {
        if (!_.isEmpty(_.get(path, accounts))) {
          return path
        }
      }, SECRET_FIELDS))
      return _.compose(_.map(path => _.assoc(path, PASSWORD_FILLED), filledSecretPaths))(accounts)
    })
}

const configSql = 'insert into user_config (type, data, valid, schema_version) values ($1, $2, $3, $4)'
function saveConfig (config) {
  return Promise.all([loadLatestConfigOrNone(), getOperatorId('middleware')])
    .then(([currentConfig, operatorId]) => {
      const newConfig = addTermsHash(_.assign(currentConfig, config))
      return db.tx(t => {
        return t.none(configSql, ['config', { config: newConfig }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
          .then(() => t.none('NOTIFY $1:name, $2', ['reload', JSON.stringify({ schema: asyncLocalStorage.getStore().get('schema'), operatorId })]))
      }).catch(console.error)
    })
}

function removeFromConfig (fields) {
  return Promise.all([loadLatestConfigOrNone(), getOperatorId('middleware')])
    .then(([currentConfig, operatorId]) => {
      const newConfig = _.omit(fields, currentConfig)
      return db.tx(t => {
        return t.none(configSql, ['config', { config: newConfig }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
          .then(() => t.none('NOTIFY $1:name, $2', ['reload', JSON.stringify({ schema: asyncLocalStorage.getStore().get('schema'), operatorId })]))
      }).catch(console.error)
    })
}

function migrationSaveConfig (config) {
  return loadLatestConfigOrNone()
    .then(currentConfig => {
      const newConfig = _.assign(currentConfig, config)
      return db.none(configSql, ['config', { config: newConfig }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
        .catch(console.error)
    })
}

function resetConfig (schemaVersion) {
  return db.none(
    configSql, 
    [
      'config',
      { config: schemaVersion === NEW_SETTINGS_LOADER_SCHEMA_VERSION ? {} : [] },
      true,
      schemaVersion
    ]
  )
}

function loadLatest (schemaVersion) {
  return Promise.all([loadLatestConfigOrNoneReturningVersion(schemaVersion), loadAccounts(schemaVersion)])
    .then(([configObj, accounts]) => ({
      config: configObj.config,
      accounts,
      version: configObj.version
    }))
}

function loadLatestConfig () {
  const sql = `select data
  from user_config
  where type=$1
  and schema_version=$2
  and valid
  order by id desc
  limit 1`
  
  return db.one(sql, ['config', NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
    .catch(err => {
      throw err
    })
}

function loadLatestConfigOrNoneReturningVersion (schemaVersion) {
  const sql = `select data, id
  from user_config
  where type=$1
  and schema_version=$2
  order by id desc
  limit 1`

  return db.oneOrNone(sql, ['config', schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? { config: row.data.config, version: row.id } : {})
}

function loadLatestConfigOrNone (schemaVersion) {
  const sql = `select data
  from user_config
  where type=$1
  and schema_version=$2
  order by id desc
  limit 1`
  
  return db.oneOrNone(sql, ['config', schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
}

function loadConfig (versionId) {
  const sql = `select data
  from user_config
  where id=$1
  and type=$2
  and schema_version=$3
  and valid`

  return db.one(sql, [versionId, 'config', NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row.data.config)
    .catch(err => {
      if (err.name === 'QueryResultError') {
        throw new Error('No such config version: ' + versionId)
      }

      throw err
    })
}

function load (versionId) {
  if (!versionId) Promise.reject('versionId is required')
  
  return Promise.all([loadConfig(versionId), loadAccounts()])
    .then(([config, accounts]) => ({
      config,
      accounts
    }))
}

function migrate () {
  return loadLatest(OLD_SETTINGS_LOADER_SCHEMA_VERSION)
    .then(res => {
      const migrated = migration.migrate(res.config, res.accounts)
      saveConfig(migrated.config)
      saveAccounts(migrated.accounts)
      
      return migrated
    })
}

module.exports = {
  saveConfig,
  migrationSaveConfig,
  resetConfig,
  saveAccounts,
  resetAccounts,
  loadAccounts,
  showAccounts,
  loadLatest,
  loadLatestConfig,
  loadLatestConfigOrNone,
  load,
  migrate,
  removeFromConfig
}
