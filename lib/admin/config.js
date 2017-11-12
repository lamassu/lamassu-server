const pify = require('pify')
const fs = pify(require('fs'))
const path = require('path')
const R = require('ramda')
const _ = require('lodash/fp')

const currencies = require('../../currencies.json')
const languageRec = require('../../languages.json')
const countries = require('../../countries.json')
const settingsLoader = require('../settings-loader')

const db = require('../db')
const options = require('../options')
const configManager = require('../config-manager')
const configValidate = require('../config-validate')
const machineLoader = require('../machine-loader')

function fetchSchema () {
  const schemaPath = path.resolve(options.lamassuServerPath, 'lamassu-schema.json')

  return fs.readFile(schemaPath)
  .then(JSON.parse)
}

function fetchConfig () {
  const sql = `select data from user_config where type=$1
  order by id desc limit 1`

  return db.oneOrNone(sql, ['config'])
  .then(row => row ? row.data.config : [])
}

function allScopes (cryptoScopes, machineScopes) {
  const scopes = []
  cryptoScopes.forEach(c => {
    machineScopes.forEach(m => scopes.push([c, m]))
  })

  return scopes
}

function allMachineScopes (machineList, machineScope) {
  const machineScopes = []

  if (machineScope === 'global' || machineScope === 'both') machineScopes.push('global')
  if (machineScope === 'specific' || machineScope === 'both') machineList.forEach(r => machineScopes.push(r))

  return machineScopes
}

function getCryptos (config, machineList) {
  const scopes = allScopes(['global'], allMachineScopes(machineList, 'both'))
  const scoped = scope => configManager.scopedValue(scope[0], scope[1], 'cryptoCurrencies', config)
  return scopes.reduce((acc, scope) => R.union(acc, scoped(scope)), [])
}

function getGroup (schema, fieldCode) {
  return schema.groups.find(group => group.fields.find(R.equals(fieldCode)))
}

function getField (schema, group, fieldCode) {
  if (!group) group = getGroup(schema, fieldCode)
  const field = schema.fields.find(r => r.code === fieldCode)
  return R.merge(R.pick(['cryptoScope', 'machineScope'], group), field)
}

const fetchMachines = () => machineLoader.getMachines()
.then(machineList => machineList.map(r => r.deviceId))

function validateCurrentConfig () {
  return fetchConfig()
  .then(configValidate.validateRequires)
}

function decorateEnabledIf (schemaFields, schemaField) {
  const code = schemaField.fieldLocator.code
  const field = _.find(f => f.code === code, schemaFields)

  return _.assign(schemaField, {
    fieldEnabledIfAny: field.enabledIfAny || [],
    fieldEnabledIfAll: field.enabledIfAll || []
  })
}

function fetchConfigGroup (code) {
  const fieldLocatorCodeEq = R.pathEq(['fieldLocator', 'code'])
  return Promise.all([fetchSchema(), fetchData(), fetchConfig(), fetchMachines()])
  .then(([schema, data, config, machineList]) => {
    const groupSchema = schema.groups.find(r => r.code === code)

    if (!groupSchema) throw new Error('No such group schema: ' + code)

    const schemaFields = groupSchema.fields
    .map(R.curry(getField)(schema, groupSchema))
    .map(f => _.assign(f, {
      fieldEnabledIfAny: f.enabledIfAny || [],
      fieldEnabledIfAll: f.enabledIfAll || []
    }))

    const candidateFields = [
      schemaFields.map(R.prop('requiredIf')),
      schemaFields.map(R.prop('enabledIfAny')),
      schemaFields.map(R.prop('enabledIfAll')),
      groupSchema.fields,
      'fiatCurrency'
    ]
    const configFields = R.uniq(R.flatten(candidateFields)).filter(R.identity)

    const reducer = (acc, configField) => {
      return acc.concat(config.filter(fieldLocatorCodeEq(configField)))
    }

    const values = _.map(f => decorateEnabledIf(schema.fields, f), configFields.reduce(reducer, []))

    groupSchema.fields = undefined
    groupSchema.entries = schemaFields

    return {
      schema: groupSchema,
      values,
      selectedCryptos: getCryptos(config, machineList),
      data
    }
  })
}

function massageCurrencies (currencies) {
  const convert = r => ({
    code: r['Alphabetic Code'],
    display: r['Currency']
  })
  const top5Codes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  const mapped = R.map(convert, currencies)
  const codeToRec = code => R.find(R.propEq('code', code), mapped)
  const top5 = R.map(codeToRec, top5Codes)
  const raw = R.uniqBy(R.prop('code'), R.concat(top5, mapped))
  return raw.filter(r => r.code[0] !== 'X' && r.display.indexOf('(') === -1)
}

const mapLanguage = lang => {
  const arr = lang.split('-')
  const code = arr[0]
  const country = arr[1]
  const langNameArr = languageRec.lang[code]
  if (!langNameArr) return null
  const langName = langNameArr[0]
  if (!country) return {code: lang, display: langName}
  return {code: lang, display: `${langName} [${country}]`}
}

const supportedLanguages = languageRec.supported
const languages = supportedLanguages.map(mapLanguage).filter(r => r)
const ALL_CRYPTOS = ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']

function fetchData () {
  return machineLoader.getMachineNames()
  .then(machineList => ({
    currencies: massageCurrencies(currencies),
    cryptoCurrencies: [
      {crypto: 'BTC', display: 'Bitcoin'},
      {crypto: 'ETH', display: 'Ethereum'},
      {crypto: 'LTC', display: 'Litecoin'},
      {crypto: 'DASH', display: 'Dash'},
      {crypto: 'ZEC', display: 'Zcash'},
      {crypto: 'BCH', display: 'Bitcoin Cash'}
    ],
    languages: languages,
    countries,
    accounts: [
      {code: 'bitpay', display: 'Bitpay', class: 'ticker', cryptos: ['BTC']},
      {code: 'kraken', display: 'Kraken', class: 'ticker', cryptos: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']},
      {code: 'bitstamp', display: 'Bitstamp', class: 'ticker', cryptos: ['BTC', 'LTC']},
      {code: 'coinbase', display: 'Coinbase', class: 'ticker', cryptos: ['BTC', 'ETH', 'LTC']},
      {code: 'mock-ticker', display: 'Mock ticker', class: 'ticker', cryptos: ALL_CRYPTOS},
      {code: 'bitcoind', display: 'bitcoind', class: 'wallet', cryptos: ['BTC']},
      {code: 'geth', display: 'geth', class: 'wallet', cryptos: ['ETH']},
      {code: 'zcashd', display: 'zcashd', class: 'wallet', cryptos: ['ZEC']},
      {code: 'litecoind', display: 'litecoind', class: 'wallet', cryptos: ['LTC']},
      {code: 'dashd', display: 'dashd', class: 'wallet', cryptos: ['DASH']},
      {code: 'bitcoincashd', display: 'bitcoincashd', class: 'wallet', cryptos: ['BCH']},
      {code: 'bitgo', display: 'BitGo', class: 'wallet', cryptos: ['BTC']},
      {code: 'bitstamp', display: 'Bitstamp', class: 'exchange', cryptos: ['BTC', 'LTC']},
      {code: 'kraken', display: 'Kraken', class: 'exchange', cryptos: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']},
      {code: 'mock-wallet', display: 'Mock wallet', class: 'wallet', cryptos: ALL_CRYPTOS},
      {code: 'no-exchange', display: 'No exchange', class: 'exchange', cryptos: ALL_CRYPTOS},
      {code: 'mock-exchange', display: 'Mock exchange', class: 'exchange', cryptos: ALL_CRYPTOS},
      {code: 'mock-sms', display: 'Mock SMS', class: 'sms'},
      {code: 'mock-id-verify', display: 'Mock ID verifier', class: 'idVerifier'},
      {code: 'twilio', display: 'Twilio', class: 'sms'},
      {code: 'mailjet', display: 'Mailjet', class: 'email'},
      {code: 'all-zero-conf', display: 'Always 0-conf', class: 'zeroConf', cryptos: ['BTC', 'ZEC', 'LTC', 'DASH', 'BCH']},
      {code: 'no-zero-conf', display: 'Always 1-conf', class: 'zeroConf', cryptos: ALL_CRYPTOS},
      {code: 'blockcypher', display: 'Blockcypher', class: 'zeroConf', cryptos: ['BTC']},
      {code: 'mock-zero-conf', display: 'Mock 0-conf', class: 'zeroConf', cryptos: ['BTC', 'ZEC', 'LTC', 'DASH', 'BCH']}
    ],
    machines: machineList.map(machine => ({machine: machine.deviceId, display: machine.name}))
  }))
}

function saveConfigGroup (results) {
  if (results.values.length === 0) return fetchConfigGroup(results.groupCode)

  return settingsLoader.modifyConfig(results.values)
  .then(() => fetchConfigGroup(results.groupCode))
}

module.exports = {
  fetchConfigGroup,
  saveConfigGroup,
  validateCurrentConfig,
  fetchConfig
}
