import binance from './binance'
import binanceus from './binanceus'
import bitgo from './bitgo'
import bitstamp from './bitstamp'
import blockcypher from './blockcypher'
import cex from './cex'
import ciphertrace from './ciphertrace'
import infura from './infura'
import itbit from './itbit'
import kraken from './kraken'
import mailgun from './mailgun'
import twilio from './twilio'

export default {
  [bitgo.code]: bitgo,
  [bitstamp.code]: bitstamp,
  [blockcypher.code]: blockcypher,
  [infura.code]: infura,
  [itbit.code]: itbit,
  [kraken.code]: kraken,
  [mailgun.code]: mailgun,
  [twilio.code]: twilio,
  [binanceus.code]: binanceus,
  [cex.code]: cex,
  [ciphertrace.code]: ciphertrace,
  [binance.code]: binance
}
