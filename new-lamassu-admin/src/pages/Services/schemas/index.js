import binance from './binance'
import binanceus from './binanceus'
import bitfinex from './bitfinex'
import bitgo from './bitgo'
import bitstamp from './bitstamp'
import blockcypher from './blockcypher'
import cex from './cex'
import galoy from './galoy'
import inforu from './inforu'
import infura from './infura'
import itbit from './itbit'
import kraken from './kraken'
import mailgun from './mailgun'
import scorechain from './scorechain'
import sumsub from './sumsub'
import telnyx from './telnyx'
import trongrid from './trongrid'
import twilio from './twilio'
import vonage from './vonage'

export default {
  [bitgo.code]: bitgo,
  [galoy.code]: galoy,
  [bitstamp.code]: bitstamp,
  [blockcypher.code]: blockcypher,
  [inforu.code]: inforu,
  [infura.code]: infura,
  [itbit.code]: itbit,
  [kraken.code]: kraken,
  [mailgun.code]: mailgun,
  [telnyx.code]: telnyx,
  [vonage.code]: vonage,
  [twilio.code]: twilio,
  [binanceus.code]: binanceus,
  [cex.code]: cex,
  [scorechain.code]: scorechain,
  [trongrid.code]: trongrid,
  [binance.code]: binance,
  [bitfinex.code]: bitfinex,
  [sumsub.code]: sumsub
}
