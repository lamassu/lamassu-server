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

const notifyReload = (dbOrTx, operatorId) =>
  dbOrTx.none(
    'NOTIFY $1:name, $2',
    ['reload', JSON.stringify({ schema: asyncLocalStorage.getStore().get('schema'), operatorId })]
  )

function saveAccounts (accounts) {
  const accountsSql = `UPDATE user_config SET data = $1, valid = TRUE, schema_version = $2 WHERE type = 'accounts';
  INSERT INTO user_config (type, data, valid, schema_version)
  SELECT 'accounts', $1, TRUE, $2 WHERE 'accounts' NOT IN (SELECT type FROM user_config)`

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

      return db.tx(t =>
        t.none(accountsSql, [{ accounts: newAccounts }, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
          .then(() => notifyReload(t, operatorId))
      ).catch(console.error)
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

const insertConfigRow = (dbOrTx, data) =>
  dbOrTx.none(
    "INSERT INTO user_config (type, data, valid, schema_version) VALUES ('config', $1, TRUE, $2)",
    [data, NEW_SETTINGS_LOADER_SCHEMA_VERSION]
  )

function saveConfig (config) {
  return Promise.all([loadLatestConfigOrNone(), getOperatorId('middleware')])
    .then(([currentConfig, operatorId]) => {
      const newConfig = addTermsHash(_.assign(currentConfig, config))
      return db.tx(t =>
        insertConfigRow(t, { config: newConfig })
          .then(() => notifyReload(t, operatorId))
      ).catch(console.error)
    })
}

function removeFromConfig (fields) {
  return Promise.all([loadLatestConfigOrNone(), getOperatorId('middleware')])
    .then(([currentConfig, operatorId]) => {
      const newConfig = _.omit(fields, currentConfig)
      return db.tx(t =>
        insertConfigRow(t, { config: newConfig })
          .then(() => notifyReload(t, operatorId))
      ).catch(console.error)
    })
}

function migrationSaveConfig (config) {
  return loadLatestConfigOrNone()
    .then(currentConfig => {
      const newConfig = _.assign(currentConfig, config)
      return insertConfigRow(db, { config: newConfig })
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
    WHERE type = 'config'
      AND schema_version = $1
      AND valid
    ORDER BY id DESC
    LIMIT 1`
  
  return db.oneOrNone(sql, [NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
    .catch(err => {
      throw err
    })
}

function loadLatestConfigOrNoneReturningVersion (schemaVersion) {
  const sql = `SELECT data, id
    FROM user_config
    WHERE type = 'config'
      AND schema_version = $1
      AND valid
    ORDER BY id DESC
    LIMIT 1`

  return db.oneOrNone(sql, [schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? { config: row.data.config, version: row.id } : {})
}

function loadLatestConfigOrNone (schemaVersion) {
  const sql = `SELECT data
    FROM user_config
    WHERE type = 'config'
      AND schema_version = $1
    ORDER BY id DESC
    LIMIT 1`
  
  return db.oneOrNone(sql, [schemaVersion || NEW_SETTINGS_LOADER_SCHEMA_VERSION])
    .then(row => row ? row.data.config : {})
}

function loadConfig (versionId) {
  const sql = `SELECT data
    FROM user_config
    WHERE id = $1
      AND type = 'config'
      AND schema_version = $2
      AND valid`

  return db.one(sql, [versionId, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
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

const fetchCurrentConfigVersion = () => {
  const sql = `SELECT id FROM user_config
    WHERE type = 'config'
      AND valid
    ORDER BY id DESC
    LIMIT 1`
  return db.one(sql).then(row => row.id)
}

module.exports = {
  saveConfig,
  migrationSaveConfig,
  saveAccounts,
  loadAccounts,
  showAccounts,
  loadLatest,
  loadLatestConfig,
  loadLatestConfigOrNone,
  load,
  removeFromConfig,
  fetchCurrentConfigVersion,
}
