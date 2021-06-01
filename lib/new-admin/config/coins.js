const _ = require('lodash/fp')

const COINS = {
  BTC: 'BTC',
  BCH: 'BCH',
  DASH: 'DASH',
  ETH: 'ETH',
  LTC: 'LTC',
  ZEC: 'ZEC'
}

const COIN_LIST = [
  { code: COINS.BTC, display: 'Bitcoin' },
  { code: COINS.BCH, display: 'Bitcoin Cash' },
  { code: COINS.DASH, display: 'Dash' },
  { code: COINS.ETH, display: 'Ethereum' },
  { code: COINS.LTC, display: 'Litecoin' },
  { code: COINS.ZEC, display: 'Zcash' }
]

const ALL_CRYPTOS = _.keys(COINS)

module.exports = { COINS, ALL_CRYPTOS, COIN_LIST }
