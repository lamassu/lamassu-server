const _ = require('lodash/fp')
const db = require('./db')
const migration = require('./config-migration')

const OLD_SETTINGS_LOADER_SCHEMA_VERSION = 1
const NEW_SETTINGS_LOADER_SCHEMA_VERSION = 2

const accountsSql = `update user_config set data = $2, valid = $3, schema_version = $4 where type = $1;
insert into user_config (type, data, valid, schema_version)
select $1, $2, $3, $4 where $1 not in (select type from user_config)`
function saveAccounts (accountsToSave) {
  return loadAccounts()
    .then(currentAccounts => {
      const newAccounts = _.assign(currentAccounts, accountsToSave)
      return db.none(accountsSql, ['accounts', { accounts: newAccounts }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
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

const configSql = 'insert into user_config (type, data, valid, schema_version) values ($1, $2, $3, $4)'
function saveConfig (config) {
  return loadLatestConfigOrNone()
    .then(currentConfig => {
      const newConfig = _.assign(currentConfig, config)
      return db.none(configSql, ['config', { config: newConfig }, true, NEW_SETTINGS_LOADER_SCHEMA_VERSION])
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
  return Promise.all([loadLatestConfigOrNone(schemaVersion), loadAccounts(schemaVersion)])
    .then(([config, accounts]) => ({
      config,
      accounts
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
  resetConfig,
  saveAccounts,
  resetAccounts,
  loadAccounts,
  loadLatest,
  loadLatestConfig,
  loadLatestConfigOrNone,
  load,
  migrate
}
