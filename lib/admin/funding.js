const BN = require('../bn')
const settingsLoader = require('../settings-loader')
const configManager = require('../config-manager')
const wallet = require('../wallet')
const ticker = require('../ticker')
const coinUtils = require('../coin-utils')

module.exports = {getFunding}

function computeCrypto (cryptoCode, _balance) {
  const unitScale = coinUtils.coins[cryptoCode].unitScale

  return BN(_balance).shift(-unitScale).round(5)
}

function computeFiat (rate, cryptoCode, _balance) {
  const unitScale = coinUtils.coins[cryptoCode].unitScale

  return BN(_balance).shift(-unitScale).mul(rate).round(5)
}

function getFunding (cryptoCode) {
  cryptoCode = cryptoCode || 'BTC'
  const cryptoDisplays = coinUtils.cryptoDisplays

  if (!coinUtils.coins[cryptoCode]) throw new Error(`Unsupported coin: ${cryptoCode}`)
  return settingsLoader.loadLatest()
  .then(settings => {
    const config = configManager.unscoped(settings.config)
    const fiatCode = config.fiatCurrency

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
