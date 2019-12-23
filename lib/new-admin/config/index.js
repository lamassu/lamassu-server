const _ = require('lodash/fp')

const { COIN_LIST: coins } = require('./coins')
const { ACCOUNT_LIST: accounts } = require('./accounts')

const countries = require('../../../countries.json')
const currenciesRec = require('../../../currencies.json')
const languageRec = require('../../../languages.json')

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
  if (!country) return { code: lang, display: langName }
  return { code: lang, display: `${langName} [${country}]` }
}

const supportedLanguages = languageRec.supported

const languages = supportedLanguages.map(mapLanguage).filter(r => r)
const currencies = massageCurrencies(currenciesRec)

module.exports = { coins, accounts, countries, currencies, languages }
