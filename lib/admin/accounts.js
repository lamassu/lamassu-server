const _ = require('lodash/fp')

const db = require('../db')
const config = require('./config')
const ph = require('../plugin-helper')

const schemas = ph.loadSchemas()

function fetchAccounts () {
  return db.oneOrNone('select data from user_config where type=$1', ['accounts'])
    .then(row => {
    // Hard code this for now
      const accounts = [{
        code: 'blockcypher',
        display: 'Blockcypher',
        fields: [
          { code: 'confidenceFactor', display: 'Confidence Factor', fieldType: 'integer', required: true, value: 40 }
        ]
      }]

      return row
        ? Promise.resolve(row.data.accounts)
        : db.none('insert into user_config (type, data, valid) values ($1, $2, $3)', ['accounts', {accounts}, true])
          .then(fetchAccounts)
    })
}

function selectedAccounts () {
  const mapAccount = v => v.fieldLocator.fieldType === 'account' &&
    v.fieldValue.value

  const mapSchema = code => schemas[code]
  return config.fetchConfig()
    .then(conf => {
      const accountCodes = _.uniq(conf.map(mapAccount)
        .filter(_.identity))

      return _.sortBy(_.get('display'), accountCodes.map(mapSchema)
        .filter(_.identity))
    })
}

function fetchAccountSchema (account) {
  return schemas[account]
}

function mergeAccount (oldAccount, newAccount) {
  if (!newAccount) return oldAccount

  const newFields = newAccount.fields

  const updateWithData = oldField => {
    const newField = _.find(r => r.code === oldField.code, newFields)
    const newValue = _.isUndefined(newField) ? oldField.value : newField.value
    return _.set('value', newValue, oldField)
  }

  const updatedFields = oldAccount.fields.map(updateWithData)

  return _.set('fields', updatedFields, oldAccount)
}

function getAccounts (accountCode) {
  const schema = fetchAccountSchema(accountCode)
  if (!schema) return Promise.reject(new Error('No schema for: ' + accountCode))

  return fetchAccounts()
    .then(accounts => {
      if (_.isEmpty(accounts)) return [schema]
      const account = _.find(r => r.code === accountCode, accounts)
      const mergedAccount = mergeAccount(schema, account)

      return updateAccounts(mergedAccount, accounts)
    })
}

function elideSecrets (account) {
  const elideSecret = field => {
    return field.fieldType === 'password'
      ? _.set('value', !_.isEmpty(field.value), field)
      : field
  }

  return _.set('fields', account.fields.map(elideSecret), account)
}

function getAccount (accountCode) {
  return getAccounts(accountCode)
    .then(accounts => _.find(r => r.code === accountCode, accounts))
    .then(elideSecrets)
}

function save (accounts) {
  return db.none('update user_config set data=$1 where type=$2', [{accounts: accounts}, 'accounts'])
}

function updateAccounts (newAccount, accounts) {
  const accountCode = newAccount.code
  const isPresent = _.some(_.matchesProperty('code', accountCode), accounts)
  const updateAccount = r => r.code === accountCode
    ? newAccount
    : r

  return isPresent
    ? _.map(updateAccount, accounts)
    : _.concat(accounts, newAccount)
}

function updateAccount (account) {
  return getAccounts(account.code)
    .then(accounts => {
      const merged = mergeAccount(_.find(_.matchesProperty('code', account.code), accounts), account)
      return save(updateAccounts(merged, accounts))
    })
    .then(() => getAccount(account.code))
}

module.exports = {
  selectedAccounts,
  getAccount,
  updateAccount
}
