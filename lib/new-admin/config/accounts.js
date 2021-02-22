const _ = require('lodash/fp')
const { COINS, ALL_CRYPTOS } = require('./coins')

const { BTC, BCH, DASH, ETH, LTC, ZEC } = COINS

const TICKER = 'ticker'
const WALLET = 'wallet'
const LAYER_2 = 'layer2'
const EXCHANGE = 'exchange'
const SMS = 'sms'
const ID_VERIFIER = 'idVerifier'
const EMAIL = 'email'
const ZERO_CONF = 'zeroConf'

const ALL_ACCOUNTS = [
  { code: 'bitpay', display: 'Bitpay', class: TICKER, cryptos: [BTC, BCH] },
  { code: 'kraken', display: 'Kraken', class: TICKER, cryptos: [BTC, ETH, LTC, DASH, ZEC, BCH] },
  { code: 'bitstamp', display: 'Bitstamp', class: TICKER, cryptos: [BTC, ETH, LTC, BCH] },
  { code: 'coinbase', display: 'Coinbase', class: TICKER, cryptos: [BTC, ETH, LTC, DASH, ZEC, BCH] },
  { code: 'itbit', display: 'itBit', class: TICKER, cryptos: [BTC, ETH] },
  { code: 'mock-ticker', display: 'Mock (Caution!)', class: TICKER, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'bitcoind', display: 'bitcoind', class: WALLET, cryptos: [BTC] },
  { code: 'no-layer2', display: 'No Layer 2', class: LAYER_2, cryptos: ALL_CRYPTOS },
  { code: 'infura', display: 'Infura', class: WALLET, cryptos: [ETH] },
  { code: 'zcashd', display: 'zcashd', class: WALLET, cryptos: [ZEC] },
  { code: 'litecoind', display: 'litecoind', class: WALLET, cryptos: [LTC] },
  { code: 'dashd', display: 'dashd', class: WALLET, cryptos: [DASH] },
  { code: 'bitcoincashd', display: 'bitcoincashd', class: WALLET, cryptos: [BCH] },
  { code: 'bitgo', display: 'BitGo', class: WALLET, cryptos: [BTC, ZEC, LTC, BCH, DASH] },
  { code: 'bitstamp', display: 'Bitstamp', class: EXCHANGE, cryptos: [BTC, ETH, LTC, BCH] },
  { code: 'itbit', display: 'itBit', class: EXCHANGE, cryptos: [BTC, ETH] },
  { code: 'kraken', display: 'Kraken', class: EXCHANGE, cryptos: [BTC, ETH, LTC, DASH, ZEC, BCH] },
  { code: 'mock-wallet', display: 'Mock (Caution!)', class: WALLET, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'no-exchange', display: 'No exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS },
  { code: 'mock-exchange', display: 'Mock exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'mock-sms', display: 'Mock SMS', class: SMS, dev: true },
  { code: 'mock-id-verify', display: 'Mock ID verifier', class: ID_VERIFIER, dev: true },
  { code: 'twilio', display: 'Twilio', class: SMS },
  { code: 'mailgun', display: 'Mailgun', class: EMAIL },
  { code: 'all-zero-conf', display: 'Always 0-conf', class: ZERO_CONF, cryptos: [BTC, ZEC, LTC, DASH, BCH] },
  { code: 'no-zero-conf', display: 'Always 1-conf', class: ZERO_CONF, cryptos: [ETH] },
  { code: 'blockcypher', display: 'Blockcypher', class: ZERO_CONF, cryptos: [BTC] },
  { code: 'mock-zero-conf', display: 'Mock 0-conf', class: ZERO_CONF, cryptos: [BTC, ZEC, LTC, DASH, BCH, ETH], dev: true }
]

const devMode = require('minimist')(process.argv.slice(2)).dev
const ACCOUNT_LIST = devMode ? ALL_ACCOUNTS : _.filter(it => !it.dev)(ALL_ACCOUNTS)

module.exports = { ACCOUNT_LIST }
