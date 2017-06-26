const _ = require('lodash/fp')

const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18},
  ZEC: {unitScale: 8},
  LTC: {unitScale: 8},
  DASH: {unitScale: 8}
}

const cryptoDisplays = [
  {cryptoCode: 'BTC', display: 'Bitcoin'},
  {cryptoCode: 'ETH', display: 'Ethereum'},
  {cryptoCode: 'ZEC', display: 'Zcash'},
  {cryptoCode: 'LTC', display: 'Litecoin'},
  {cryptoCode: 'DASH', display: 'Dash'}
]

module.exports = {coins, cryptoDisplays, buildUrl, unitScale, display}

function buildUrl (cryptoCode, address) {
  switch (cryptoCode) {
    case 'BTC': return `bitcoin:${address}`
    case 'ETH': return `ethereum:${address}`
    case 'ZEC': return `zcash:${address}`
    case 'LTC': return `litecoin:${address}`
    case 'DASH': return `dash:${address}`
    default: throw new Error(`Unsupported crypto: ${cryptoCode}`)
  }
}

function display (cryptoCode) {
  const rec = _.find(['cryptoCode', cryptoCode], cryptoDisplays)
  if (!rec) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return rec.display
}

function unitScale (cryptoCode) {
  const scaleRec = coins[cryptoCode]
  if (!scaleRec) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return scaleRec.unitScale
}
