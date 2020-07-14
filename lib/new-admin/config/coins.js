const _ = require('lodash/fp')

const COINS = {
  BTC: 'BTC',
  ETH: 'ETH',
  LTC: 'LTC',
  DASH: 'DASH',
  ZEC: 'ZEC',
  BCH: 'BCH'
}

const COIN_LIST = [
  { code: COINS.BTC, display: 'Bitcoin' },
  { code: COINS.ETH, display: 'Ethereum' },
  { code: COINS.LTC, display: 'Litecoin' },
  { code: COINS.DASH, display: 'Dash' },
  { code: COINS.ZEC, display: 'Zcash' },
  { code: COINS.BCH, display: 'Bitcoin Cash' },
  { code: COINS.DUC, display: 'Ducatus' }
]

const ALL_CRYPTOS = _.keys(COINS)

module.exports = { COINS, ALL_CRYPTOS, COIN_LIST }
