const { COINS, ALL_CRYPTOS } = require('@lamassu/coins')
const _ = require('lodash/fp')

const { ALL } = require('../../plugins/common/ccxt')

const { BTC, BCH, DASH, ETH, LTC, USDT, ZEC, XMR, LN, TRX, USDT_TRON } = COINS
const { bitpay, coinbase, itbit, bitstamp, kraken, binanceus, cex, binance, bitfinex } = ALL

const TICKER = 'ticker'
const WALLET = 'wallet'
const LAYER_2 = 'layer2'
const EXCHANGE = 'exchange'
const SMS = 'sms'
const ID_VERIFIER = 'idVerifier'
const EMAIL = 'email'
const ZERO_CONF = 'zeroConf'
const WALLET_SCORING = 'wallet_scoring'
const COMPLIANCE = 'compliance'

const ALL_ACCOUNTS = [
  { code: 'bitfinex', display: 'Bitfinex', class: TICKER, cryptos: bitfinex.CRYPTO },
  { code: 'bitfinex', display: 'Bitfinex', class: EXCHANGE, cryptos: bitfinex.CRYPTO },
  { code: 'binance', display: 'Binance', class: TICKER, cryptos: binance.CRYPTO },
  { code: 'binanceus', display: 'Binance.us', class: TICKER, cryptos: binanceus.CRYPTO },
  { code: 'cex', display: 'CEX.IO', class: TICKER, cryptos: cex.CRYPTO },
  { code: 'bitpay', display: 'Bitpay', class: TICKER, cryptos: bitpay.CRYPTO },
  { code: 'kraken', display: 'Kraken', class: TICKER, cryptos: kraken.CRYPTO },
  { code: 'bitstamp', display: 'Bitstamp', class: TICKER, cryptos: bitstamp.CRYPTO },
  { code: 'coinbase', display: 'Coinbase', class: TICKER, cryptos: coinbase.CRYPTO },
  { code: 'itbit', display: 'itBit', class: TICKER, cryptos: itbit.CRYPTO },
  { code: 'mock-ticker', display: 'Mock (Caution!)', class: TICKER, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'bitcoind', display: 'bitcoind', class: WALLET, cryptos: [BTC] },
  { code: 'no-layer2', display: 'No Layer 2', class: LAYER_2, cryptos: ALL_CRYPTOS },
  { code: 'infura', display: 'Infura/Alchemy', class: WALLET, cryptos: [ETH, USDT] },
  { code: 'trongrid', display: 'Trongrid', class: WALLET, cryptos: [TRX, USDT_TRON] },
  { code: 'geth', display: 'geth (deprecated)', class: WALLET, cryptos: [ETH, USDT] },
  { code: 'zcashd', display: 'zcashd', class: WALLET, cryptos: [ZEC] },
  { code: 'litecoind', display: 'litecoind', class: WALLET, cryptos: [LTC] },
  { code: 'dashd', display: 'dashd', class: WALLET, cryptos: [DASH] },
  { code: 'monerod', display: 'monerod', class: WALLET, cryptos: [XMR] },
  { code: 'bitcoincashd', display: 'bitcoincashd', class: WALLET, cryptos: [BCH] },
  { code: 'bitgo', display: 'BitGo', class: WALLET, cryptos: [BTC, ZEC, LTC, BCH, DASH] },
  { code: 'galoy', display: 'Galoy', class: WALLET, cryptos: [LN] },
  { code: 'bitstamp', display: 'Bitstamp', class: EXCHANGE, cryptos: bitstamp.CRYPTO },
  { code: 'itbit', display: 'itBit', class: EXCHANGE, cryptos: itbit.CRYPTO },
  { code: 'kraken', display: 'Kraken', class: EXCHANGE, cryptos: kraken.CRYPTO },
  { code: 'binance', display: 'Binance', class: EXCHANGE, cryptos: binance.CRYPTO },
  { code: 'binanceus', display: 'Binance.us', class: EXCHANGE, cryptos: binanceus.CRYPTO },
  { code: 'cex', display: 'CEX.IO', class: EXCHANGE, cryptos: cex.CRYPTO },
  { code: 'mock-wallet', display: 'Mock (Caution!)', class: WALLET, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'no-exchange', display: 'No exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS },
  { code: 'mock-exchange', display: 'Mock exchange', class: EXCHANGE, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'mock-sms', display: 'Mock SMS', class: SMS, dev: true },
  { code: 'mock-id-verify', display: 'Mock ID verifier', class: ID_VERIFIER, dev: true },
  { code: 'twilio', display: 'Twilio', class: SMS },
  { code: 'telnyx', display: 'Telnyx', class: SMS },
  { code: 'vonage', display: 'Vonage', class: SMS },
  { code: 'inforu', display: 'InforU', class: SMS },
  { code: 'mailgun', display: 'Mailgun', class: EMAIL },
  { code: 'mock-email', display: 'Mock Email', class: EMAIL, dev: true },
  { code: 'none', display: 'None', class: ZERO_CONF, cryptos: ALL_CRYPTOS },
  { code: 'blockcypher', display: 'Blockcypher', class: ZERO_CONF, cryptos: [BTC] },
  { code: 'mock-zero-conf', display: 'Mock 0-conf', class: ZERO_CONF, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'scorechain', display: 'Scorechain', class: WALLET_SCORING, cryptos: [BTC, ETH, LTC, BCH, DASH, USDT, USDT_TRON, TRX] },
  { code: 'mock-scoring', display: 'Mock scoring', class: WALLET_SCORING, cryptos: ALL_CRYPTOS, dev: true },
  { code: 'sumsub', display: 'Sumsub', class: COMPLIANCE },
  { code: 'mock-compliance', display: 'Mock Compliance', class: COMPLIANCE, dev: true },
]

const flags = require('minimist')(process.argv.slice(2))
const devMode = flags.dev || flags.lamassuDev
const ACCOUNT_LIST = devMode ? ALL_ACCOUNTS : _.filter(it => !it.dev)(ALL_ACCOUNTS)

module.exports = { ACCOUNT_LIST }
