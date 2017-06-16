const coins = {
  BTC: {unitScale: 8},
  ETH: {unitScale: 18}
}

const cryptoDisplays = [
  {cryptoCode: 'BTC', display: 'Bitcoin'},
  {cryptoCode: 'ETH', display: 'Ethereum'}
]

module.exports = {coins, cryptoDisplays, buildUrl}

function buildUrl (cryptoCode, address) {
  switch (cryptoCode) {
    case 'BTC': return `bitcoin:${address}`
    case 'ETH': return `ethereum:${address}`
    default: throw new Error(`Unsupported crypto: ${cryptoCode}`)
  }
}
