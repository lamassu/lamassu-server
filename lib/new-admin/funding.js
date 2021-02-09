const _ = require('lodash/fp')
const BN = require('../bn')
const settingsLoader = require('../new-settings-loader')
const configManager = require('../new-config-manager')
const wallet = require('../wallet')
const ticker = require('../ticker')
const coinUtils = require('../coin-utils')
const logger = require('../logger')

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

function computeCrypto (cryptoCode, _balance) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale

  return BN(_balance).shift(-unitScale).round(5)
}

function computeFiat (rate, cryptoCode, _balance) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale

  return BN(_balance).shift(-unitScale).mul(rate).round(5)
}

function getSingleCoinFunding (settings, fiatCode, cryptoCode) {
  const promises = [
    wallet.newFunding(settings, cryptoCode),
    ticker.getRates(settings, fiatCode, cryptoCode)
  ]

  return Promise.all(promises)
    .then(([fundingRec, ratesRec]) => {
      const rates = ratesRec.rates
      const rate = (rates.ask.add(rates.bid)).div(2)
      const fundingConfirmedBalance = fundingRec.fundingConfirmedBalance
      const fiatConfirmedBalance = computeFiat(rate, cryptoCode, fundingConfirmedBalance)
      const pending = cryptoCode === 'ETH'
        ? fundingRec.fundingPendingBalance - fundingRec.fundingConfirmedBalance
        : fundingRec.fundingPendingBalance
      const fiatPending = computeFiat(rate, cryptoCode, pending)
      const fundingAddress = fundingRec.fundingAddress
      const fundingAddressUrl = coinUtils.buildUrl(cryptoCode, fundingAddress)

      return {
        cryptoCode,
        fundingAddress,
        fundingAddressUrl,
        confirmedBalance: computeCrypto(cryptoCode, fundingConfirmedBalance).toFormat(5),
        pending: computeCrypto(cryptoCode, pending).toFormat(5),
        fiatConfirmedBalance: fiatConfirmedBalance,
        fiatPending: fiatPending,
        fiatCode
      }
    })
}

// Promise.allSettled not running on current version of node
const reflect = p => p.then(value => ({value, status: "fulfilled" }), error => ({error: error.toString(), status: "rejected" }))

function getFunding () {
  return settingsLoader.loadLatest().then(settings => {
      const cryptoCodes = configManager.getAllCryptoCurrencies(settings.config)
      const fiatCode = configManager.getGlobalLocale(settings.config).fiatCurrency
      const pareCoins = c => _.includes(c.cryptoCode, cryptoCodes)
      const cryptoCurrencies = coinUtils.cryptoCurrencies()
      const cryptoDisplays = _.filter(pareCoins, cryptoCurrencies)

      const promises = cryptoDisplays.map(it => getSingleCoinFunding(settings, fiatCode, it.cryptoCode))
      return Promise.all(promises.map(reflect))
        .then((response) => {
          const mapped = response.map(it => _.merge({ errorMsg: it.error }, it.value))
          return _.toArray(_.merge(mapped, cryptoDisplays))
        })
    })
}

module.exports = { getFunding }
