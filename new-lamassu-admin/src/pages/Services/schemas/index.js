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
import telnyx from './telnyx'
import trongrid from './trongrid'
import twilio from './twilio'
import vonage from './vonage'

export default {
  [bitgo.code]: bitgo,
  [bitstamp.code]: bitstamp,
  [blockcypher.code]: blockcypher,
  [infura.code]: infura,
  [itbit.code]: itbit,
  [kraken.code]: kraken,
  [mailgun.code]: mailgun,
  [telnyx.code]: telnyx,
  [vonage.code]: vonage,
  [twilio.code]: twilio,
  [binanceus.code]: binanceus,
  [cex.code]: cex,
  [ciphertrace.code]: ciphertrace,
  [trongrid.code]: trongrid,
  [binance.code]: binance
}
