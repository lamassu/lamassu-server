const BN = require('./bn')
const configManager = require('./new-config-manager')
const coinUtils = require('./coin-utils')

function truncateCrypto (cryptoAtoms, cryptoCode) {
  const DECIMAL_PLACES = 3
  if (cryptoAtoms.eq(0)) return cryptoAtoms

  const scale = 5 // TODO: change this to coins.displayScale when coins have that attribute
  const scaleFactor = BN(10).pow(scale)

  return BN(cryptoAtoms).truncated().div(scaleFactor)
    .round(DECIMAL_PLACES).times(scaleFactor)
}

function fiatToCrypto (tx, rec, deviceId, config) {
  const usableFiat = rec.fiat - rec.cashInFee

  const commissions = configManager.getCommissions(tx.cryptoCode, deviceId, config)
  const tickerRate = BN(tx.rawTickerPrice)
  const discount = getDiscountRate(tx.discount, commissions[tx.direction])
  const rate = tickerRate.mul(discount).round(5)
  const unitScale = coinUtils.getCryptoCurrency(tx.cryptoCode).unitScale
  const unitScaleFactor = BN(10).pow(unitScale)

  return truncateCrypto(BN(usableFiat).div(rate.div(unitScaleFactor)), tx.cryptoCode)
}

function getDiscountRate (discount, commission) {
  const bnDiscount = discount ? BN(discount) : BN(0)
  const bnCommission = BN(commission)
  const percentageDiscount = BN(1).sub(bnDiscount.div(100))
  const percentageCommission = bnCommission.div(100)
  return BN(1).add(percentageDiscount.mul(percentageCommission))
}

module.exports = {
  truncateCrypto,
  fiatToCrypto,
  getDiscountRate
}
