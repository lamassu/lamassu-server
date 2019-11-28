const _ = require('lodash/fp')
const devMode = require('minimist')(process.argv.slice(2)).dev

const settingsLoader = require('../new-settings-loader')
const machineLoader = require('../machine-loader')

const currencies = require('../../currencies.json')
const languageRec = require('../../languages.json')
const countries = require('../../countries.json')

function saveConfig (config) {
  return settingsLoader.saveConfig(config)
}

function getConfig () {
  return settingsLoader.getConfig()
}

function massageCurrencies (currencies) {
  const convert = r => ({
    code: r['Alphabetic Code'],
    display: r['Currency']
  })
  const top5Codes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  const mapped = _.map(convert, currencies)
  const codeToRec = code => _.find(_.matchesProperty('code', code), mapped)
  const top5 = _.map(codeToRec, top5Codes)
  const raw = _.uniqBy(_.get('code'), _.concat(top5, mapped))
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

const filterAccounts = (data, isDevMode) => {
  const notAllowed = ['mock-ticker', 'mock-wallet', 'mock-exchange', 'mock-sms', 'mock-id-verify', 'mock-zero-conf']
  const filterOut = o => _.includes(o.code, notAllowed)
  return isDevMode ? data : {...data, accounts: _.filter(a => !filterOut(a), data.accounts)}
}

function fetchData () {
  return machineLoader.getMachineNames()
    .then(machineList => ({
      currencies: massageCurrencies(currencies),
      cryptoCurrencies: [
        {code: 'BTC', display: 'Bitcoin'},
        {code: 'ETH', display: 'Ethereum'},
        {code: 'LTC', display: 'Litecoin'},
        {code: 'DASH', display: 'Dash'},
        {code: 'ZEC', display: 'Zcash'},
        {code: 'BCH', display: 'Bitcoin Cash'}
      ],
      languages: languages,
      countries,
      accounts: [
        {code: 'bitpay', display: 'Bitpay', class: 'ticker', cryptos: ['BTC', 'BCH']},
        {code: 'kraken', display: 'Kraken', class: 'ticker', cryptos: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']},
        {code: 'bitstamp', display: 'Bitstamp', class: 'ticker', cryptos: ['BTC', 'ETH', 'LTC', 'BCH']},
        {code: 'coinbase', display: 'Coinbase', class: 'ticker', cryptos: ['BTC', 'ETH', 'LTC', 'BCH']},
        {code: 'itbit', display: 'itBit', class: 'ticker', cryptos: ['BTC']},
        {code: 'mock-ticker', display: 'Mock (Caution!)', class: 'ticker', cryptos: ALL_CRYPTOS},
        {code: 'bitcoind', display: 'bitcoind', class: 'wallet', cryptos: ['BTC']},
        {code: 'no-layer2', display: 'No Layer 2', class: 'layer2', cryptos: ALL_CRYPTOS},
        {code: 'infura', display: 'Infura', class: 'wallet', cryptos: ['ETH']},
        {code: 'geth', display: 'geth', class: 'wallet', cryptos: ['ETH']},
        {code: 'zcashd', display: 'zcashd', class: 'wallet', cryptos: ['ZEC']},
        {code: 'litecoind', display: 'litecoind', class: 'wallet', cryptos: ['LTC']},
        {code: 'dashd', display: 'dashd', class: 'wallet', cryptos: ['DASH']},
        {code: 'bitcoincashd', display: 'bitcoincashd', class: 'wallet', cryptos: ['BCH']},
        {code: 'bitgo', display: 'BitGo', class: 'wallet', cryptos: ['BTC', 'ZEC', 'LTC', 'BCH', 'DASH']},
        {code: 'bitstamp', display: 'Bitstamp', class: 'exchange', cryptos: ['BTC', 'ETH', 'LTC', 'BCH']},
        {code: 'itbit', display: 'itBit', class: 'exchange', cryptos: ['BTC']},
        {code: 'kraken', display: 'Kraken', class: 'exchange', cryptos: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH']},
        {code: 'mock-wallet', display: 'Mock (Caution!)', class: 'wallet', cryptos: ALL_CRYPTOS},
        {code: 'no-exchange', display: 'No exchange', class: 'exchange', cryptos: ALL_CRYPTOS},
        {code: 'mock-exchange', display: 'Mock exchange', class: 'exchange', cryptos: ALL_CRYPTOS},
        {code: 'mock-sms', display: 'Mock SMS', class: 'sms'},
        {code: 'mock-id-verify', display: 'Mock ID verifier', class: 'idVerifier'},
        {code: 'twilio', display: 'Twilio', class: 'sms'},
        {code: 'mailgun', display: 'Mailgun', class: 'email'},
        {code: 'all-zero-conf', display: 'Always 0-conf', class: 'zeroConf', cryptos: ['BTC', 'ZEC', 'LTC', 'DASH', 'BCH']},
        {code: 'no-zero-conf', display: 'Always 1-conf', class: 'zeroConf', cryptos: ALL_CRYPTOS},
        {code: 'blockcypher', display: 'Blockcypher', class: 'zeroConf', cryptos: ['BTC']},
        {code: 'mock-zero-conf', display: 'Mock 0-conf', class: 'zeroConf', cryptos: ['BTC', 'ZEC', 'LTC', 'DASH', 'BCH', 'ETH']}
      ],
      machines: machineList.map(machine => ({machine: machine.deviceId, display: machine.name}))
    }))
    .then((data) => {
      return filterAccounts(data, devMode)
    })
}

module.exports = {
  saveConfig,
  getConfig,
  fetchData
}
