const { COINS, ALL_CRYPTOS } = require('lamassu-coins')
const _ = require('lodash/fp')

const { ALL } = require('../../plugins/common/ccxt')

const { BTC, BCH, DASH, ETH, LTC, ZEC, USDT, XMR } = COINS
const { bitpay, coinbase, itbit, bitstamp, kraken, binanceus, cex, ftx } = ALL

const TICKER = 'ticker'
const WALLET = 'wallet'
const LAYER_2 = 'layer2'
const EXCHANGE = 'exchange'
const SMS = 'sms'
const ID_VERIFIER = 'idVerifier'
const EMAIL = 'email'
const ZERO_CONF = 'zeroConf'

const ALL_ACCOUNTS = [
  { code: 'binanceus', display: 'Binance.us', class: TICKER, cryptos: binanceus.CRYPTO },
  { code: 'cex', display: 'Cex', class: TICKER, cryptos: cex.CRYPTO },
  { code: 'ftx', display: 'Ftx', class: TICKER, cryptos: ftx.CRYPTO },
  { code: 'bitpay', display: 'Bitpay', class: TICKER, cryptos: bitpay.CRYPTO },
  { code: 'kraken', display: 'Kraken', class: TICKER, cryptos: kraken.CRYPTO },
  { code: 'bitstamp', display: 'Bitstamp', class: TICKER, cryptos: bitstamp.CRYPTO },
  { code: 'coinbase', display: 'Coinbase', class: TICKER, cryptos: coinbase.CRYPTO },
  { code: 'itbit', display: 'itBit', class: TICKER, cryptos: itbit.CRYPTO },
  { code: 'mock-ticker', display: 'Mock (Caution!)', class: TICKER, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'bitcoind', display: 'bitcoind', class: WALLET, cryptos: [BTC] },
  { code: 'no-layer2', display: 'No Layer 2', class: LAYER_2, cryptos: ALL_CRYPTOS },
  { code: 'infura', display: 'Infura', class: WALLET, cryptos: [ETH, USDT] },
  { code: 'geth', display: 'geth', class: WALLET, cryptos: [ETH, USDT] },
  { code: 'zcashd', display: 'zcashd', class: WALLET, cryptos: [ZEC] },
  { code: 'litecoind', display: 'litecoind', class: WALLET, cryptos: [LTC] },
  { code: 'dashd', display: 'dashd', class: WALLET, cryptos: [DASH] },
  { code: 'monerod', display: 'monerod', class: WALLET, cryptos: [XMR] },
  { code: 'bitcoincashd', display: 'bitcoincashd', class: WALLET, cryptos: [BCH] },
  { code: 'bitgo', display: 'BitGo', class: WALLET, cryptos: [BTC, ZEC, LTC, BCH, DASH] },
  { code: 'bitstamp', display: 'Bitstamp', class: EXCHANGE, cryptos: bitstamp.CRYPTO },
  { code: 'itbit', display: 'itBit', class: EXCHANGE, cryptos: itbit.CRYPTO },
  { code: 'kraken', display: 'Kraken', class: EXCHANGE, cryptos: kraken.CRYPTO },
  { code: 'binanceus', display: 'Binance.us', class: EXCHANGE, cryptos: binanceus.CRYPTO },
  { code: 'cex', display: 'Cex', class: EXCHANGE, cryptos: cex.CRYPTO },
  { code: 'ftx', display: 'Ftx', class: EXCHANGE, cryptos: ftx.CRYPTO },
  { code: 'mock-wallet', display: 'Mock (Caution!)', class: WALLET, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'no-exchange', display: 'No exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS },
  { code: 'mock-exchange', display: 'Mock exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'mock-sms', display: 'Mock SMS', class: SMS, dev: true },
  { code: 'mock-id-verify', display: 'Mock ID verifier', class: ID_VERIFIER, dev: true },
  { code: 'twilio', display: 'Twilio', class: SMS },
  { code: 'mailgun', display: 'Mailgun', class: EMAIL },
  { code: 'none', display: 'None', class: ZERO_CONF, cryptos: [BTC, ZEC, LTC, DASH, BCH, ETH, XMR] },
  { code: 'blockcypher', display: 'Blockcypher', class: ZERO_CONF, cryptos: [BTC] },
  { code: 'mock-zero-conf', display: 'Mock 0-conf', class: ZERO_CONF, cryptos: ALL_CRYPTOS, dev: true }
]

const devMode = require('minimist')(process.argv.slice(2)).dev
const ACCOUNT_LIST = devMode ? ALL_ACCOUNTS : _.filter(it => !it.dev)(ALL_ACCOUNTS)

module.exports = { ACCOUNT_LIST }
