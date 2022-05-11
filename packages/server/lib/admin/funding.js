const _ = require('lodash/fp')
const BN = require('../bn')
const settingsLoader = require('./settings-loader')
const configManager = require('./config-manager')
const wallet = require('../wallet')
const ticker = require('../ticker')
const { utils: coinUtils } = require('@lamassu/coins')
const machineLoader = require('../machine-loader')

module.exports = {getFunding}

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

  return new BN(_balance).shiftedBy(-unitScale).decimalPlaces(5)
}

function computeFiat (rate, cryptoCode, _balance) {
  const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale

  return new BN(_balance).shiftedBy(-unitScale).times(rate).decimalPlaces(5)
}

function getFunding (_cryptoCode) {
  return Promise.all([settingsLoader.loadLatest(), fetchMachines()])
    .then(([settings, machineList]) => {
      const config = configManager.unscoped(settings.config)
      const cryptoCodes = getCryptos(settings.config, machineList)
      const cryptoCode = _cryptoCode || cryptoCodes[0]
      const fiatCode = config.fiatCurrency
      const pareCoins = c => _.includes(c.cryptoCode, cryptoCodes)
      const cryptoCurrencies = coinUtils.cryptoCurrencies()
      const cryptoDisplays = _.filter(pareCoins, cryptoCurrencies)
      const cryptoRec = coinUtils.getCryptoCurrency(cryptoCode)

      if (!cryptoRec) throw new Error(`Unsupported coin: ${cryptoCode}`)

      const promises = [
        wallet.newFunding(settings, cryptoCode),
        ticker.getRates(settings, fiatCode, cryptoCode)
      ]

      return Promise.all(promises)
        .then(([fundingRec, ratesRec]) => {
          const rates = ratesRec.rates
          const rate = (rates.ask.plus(rates.bid)).div(2)
          const fundingConfirmedBalance = fundingRec.fundingConfirmedBalance
          const fiatConfirmedBalance = computeFiat(rate, cryptoCode, fundingConfirmedBalance)
          const pending = fundingRec.fundingPendingBalance
          const fiatPending = computeFiat(rate, cryptoCode, pending)
          const fundingAddress = fundingRec.fundingAddress
          const fundingAddressUrl = coinUtils.buildUrl(cryptoCode, fundingAddress)

          return {
            cryptoCode,
            cryptoDisplays,
            fundingAddress,
            fundingAddressUrl,
            confirmedBalance: computeCrypto(cryptoCode, fundingConfirmedBalance).toFormat(5),
            pending: computeCrypto(cryptoCode, pending).toFormat(5),
            fiatConfirmedBalance: fiatConfirmedBalance.toFormat(2),
            fiatPending: fiatPending.toFormat(2),
            fiatCode
          }
        })
    })
}
