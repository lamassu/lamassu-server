const _ = require('lodash/fp')
const BN = require('../bn')
const settingsLoader = require('../settings-loader')
const configManager = require('../config-manager')
const wallet = require('../wallet')
const ticker = require('../ticker')
const coinUtils = require('../coin-utils')
const machineLoader = require('../machine-loader')

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

  return _.uniq(_.flatten(_.map(scoped, scopes)))
}

function fetchMachines () {
  return machineLoader.getMachines()
    .then(machineList => machineList.map(r => r.deviceId))
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
      const pending = fundingRec.fundingPendingBalance.sub(fundingConfirmedBalance)
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

function getFunding () {
  return Promise.all([settingsLoader.loadLatest(), fetchMachines()])
    .then(([settings, machineList]) => {
      const config = configManager.unscoped(settings.config)
      const cryptoCodes = getCryptos(settings.config, machineList)
      const fiatCode = config.fiatCurrency
      const pareCoins = c => _.includes(c.cryptoCode, cryptoCodes)
      const cryptoCurrencies = coinUtils.cryptoCurrencies()
      const cryptoDisplays = _.filter(pareCoins, cryptoCurrencies)

      const promises = cryptoDisplays.map(it => getSingleCoinFunding(settings, fiatCode, it.cryptoCode))
      return Promise.all(promises)
        .then((response) => {
          return _.toArray(_.merge(response, cryptoDisplays))
        })
    })
}

module.exports = { getFunding }
