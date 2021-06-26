const BN = require('./bn')
const configManager = require('./new-config-manager')
const { utils: coinUtils } = require('lamassu-coins')

function truncateCrypto (cryptoAtoms, cryptoCode) {
  const DECIMAL_PLACES = 6
  if (cryptoAtoms.eq(0)) return cryptoAtoms

  const scale = coinUtils.getCryptoCurrency(cryptoCode).unitScale
  const scaleFactor = BN(10).pow(scale)

  return new BN(cryptoAtoms).integerValue(BN.ROUND_DOWN).div(scaleFactor)
    .decimalPlaces(DECIMAL_PLACES).times(scaleFactor)
}

function fiatToCrypto (tx, rec, deviceId, config) {
  const usableFiat = rec.fiat - rec.cashInFee

  const commissions = configManager.getCommissions(tx.cryptoCode, deviceId, config)
  const tickerRate = new BN(tx.rawTickerPrice)
  const discount = getDiscountRate(tx.discount, commissions[tx.direction])
  const rate = tickerRate.times(discount).decimalPlaces(5)
  const unitScale = coinUtils.getCryptoCurrency(tx.cryptoCode).unitScale
  const unitScaleFactor = new BN(10).pow(unitScale)

  return truncateCrypto(new BN(usableFiat).div(rate.div(unitScaleFactor)), tx.cryptoCode)
}

function getDiscountRate (discount, commission) {
  const bnDiscount = discount ? new BN(discount) : new BN(0)
  const bnCommission = new BN(commission)
  const percentageDiscount = new BN(1).minus(bnDiscount.div(100))
  const percentageCommission = bnCommission.div(100)
  return new BN(1).plus(percentageDiscount.times(percentageCommission))
}

module.exports = {
  truncateCrypto,
  fiatToCrypto,
  getDiscountRate
}
