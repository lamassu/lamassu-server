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

const accountsSql = `UPDATE user_config SET data = $2, valid = $3, schema_version = $4 WHERE type = $1;
INSERT INTO user_config (type, data, valid, schema_version)
SELECT $1, $2, $3, $4 WHERE $1 NOT IN (SELECT type FROM user_config)`

function saveAccounts (accounts) {
  return Promise.all([loadAccounts(), getOperatorId('middleware')])
    .then(([currentAccounts, operatorId]) => {
      const newAccounts = _.merge(currentAccounts, accounts)

      // Only allow one wallet scoring active at a time
      if (accounts.elliptic?.enabled && newAccounts.scorechain) {
        newAccounts.scorechain.enabled = false
      }

      if (accounts.scorechain?.enabled && newAccounts.elliptic) {
        newAccounts.elliptic.enabled = false
      }

      return db.tx(t => {
        return t.none(accountsSql, ['accounts', { accounts: newAccounts }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
          .then(() => t.none('NOTIFY $1:name, $2', ['reload', JSON.stringify({ schema: asyncLocalStorage.getStore().get('schema'), operatorId })]))
      }).catch(console.error)
    })
}

function loadAccounts (schemaVersion) {
  const sql = `SELECT data
    FROM user_config
    WHERE type = $1
      AND schema_version = $2
      AND valid
    ORDER BY id DESC
    LIMIT 1`

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

const configSql = 'INSERT INTO user_config (type, data, valid, schema_version) VALUES ($1, $2, $3, $4)'
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

function loadLatest (schemaVersion) {
  return Promise.all([loadLatestConfigOrNoneReturningVersion(schemaVersion), loadAccounts(schemaVersion)])
    .then(([configObj, accounts]) => ({
      config: configObj.config,
      accounts,
      version: configObj.version
    }))
}

function loadLatestConfig () {
  const sql = `SELECT data
    FROM user_config
    WHERE type = $1
      AND schema_version = $2
      AND valid
    ORDER BY id DESC
    LIMIT 1`
  
  return db.one(sql, ['config', NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
    .catch(err => {
      throw err
    })
}

function loadLatestConfigOrNoneReturningVersion (schemaVersion) {
  const sql = `SELECT data, id
    FROM user_config
    WHERE type = $1
      AND schema_version = $2
    ORDER BY id DESC
    LIMIT 1`

  return db.oneOrNone(sql, ['config', schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? { config: row.data.config, version: row.id } : {})
}

function loadLatestConfigOrNone (schemaVersion) {
  const sql = `SELECT data
    FROM user_config
    WHERE type = $1
      AND schema_version = $2
    ORDER BY id DESC
    LIMIT 1`
  
  return db.oneOrNone(sql, ['config', schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
}

function loadConfig (versionId) {
  const sql = `SELECT data
    FROM user_config
    WHERE id = $1
      AND type = $2
      AND schema_version = $3
      AND valid`

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
