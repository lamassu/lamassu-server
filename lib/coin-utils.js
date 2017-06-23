const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18},
  ZEC: {unitScale: 8}
}

const cryptoDisplays = [
  {cryptoCode: 'BTC', display: 'Bitcoin'},
  {cryptoCode: 'ETH', display: 'Ethereum'},
  {cryptoCode: 'ZEC', display: 'Zcash'}
]

module.exports = {coins, cryptoDisplays, buildUrl, unitScale}

function buildUrl (cryptoCode, address) {
  switch (cryptoCode) {
    case 'BTC': return `bitcoin:${address}`
    case 'ETH': return `ethereum:${address}`
    case 'ZEC': return `zcash:${address}`
    default: throw new Error(`Unsupported crypto: ${cryptoCode}`)
  }
}

function unitScale (cryptoCode) {
  const scaleRec = coins[cryptoCode]
  if (!scaleRec) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return scaleRec.unitScale
}
