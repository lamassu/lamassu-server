const pify = require('pify')
const fs = pify(require('fs'))
const path = require('path')
const R = require('ramda')

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

function fetchConfigGroup (code) {
  const fieldLocatorCodeEq = R.pathEq(['fieldLocator', 'code'])
  return Promise.all([fetchSchema(), fetchData(), fetchConfig(), fetchMachines()])
  .then(([schema, data, config, machineList]) => {
    const groupSchema = schema.groups.find(r => r.code === code)

    if (!groupSchema) throw new Error('No such group schema: ' + code)

    const schemaFields = groupSchema.fields
    .map(R.curry(getField)(schema, groupSchema))

    const candidateFields = [
      schemaFields.map(R.prop('requiredIf')),
      schemaFields.map(R.prop('enabledIf')),
      groupSchema.fields,
      'fiatCurrency'
    ]
    const configFields = R.uniq(R.flatten(candidateFields)).filter(R.identity)

    const values = configFields
    .reduce((acc, configField) => acc.concat(config.filter(fieldLocatorCodeEq(configField))), [])

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

function fetchData () {
  return machineLoader.getMachineNames()
  .then(machineList => ({
    currencies: massageCurrencies(currencies),
    cryptoCurrencies: [{crypto: 'BTC', display: 'Bitcoin'}, {crypto: 'ETH', display: 'Ethereum'}],
    languages: languages,
    countries,
    accounts: [
      {code: 'bitpay', display: 'Bitpay', class: 'ticker', cryptos: ['BTC']},
      {code: 'kraken', display: 'Kraken', class: 'ticker', cryptos: ['BTC', 'ETH']},
      {code: 'bitstamp', display: 'Bitstamp', class: 'ticker', cryptos: ['BTC']},
      {code: 'coinbase', display: 'Coinbase', class: 'ticker', cryptos: ['BTC', 'ETH']},
      {code: 'bitcoind', display: 'bitcoind', class: 'wallet', cryptos: ['BTC']},
      {code: 'bitgo', display: 'BitGo', class: 'wallet', cryptos: ['BTC']},
      {code: 'geth', display: 'geth', class: 'wallet', cryptos: ['ETH']},
      {code: 'mock-wallet', display: 'Mock wallet', class: 'wallet', cryptos: ['BTC', 'ETH']},
      {code: 'no-exchange', display: 'No exchange', class: 'exchange', cryptos: ['BTC', 'ETH']},
      {code: 'mock-exchange', display: 'Mock exchange', class: 'exchange', cryptos: ['BTC', 'ETH']},
      {code: 'mock-sms', display: 'Mock SMS', class: 'sms'},
      {code: 'mock-id-verify', display: 'Mock ID verifier', class: 'idVerifier'},
      {code: 'twilio', display: 'Twilio', class: 'sms'},
      {code: 'mailjet', display: 'Mailjet', class: 'email'}
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
