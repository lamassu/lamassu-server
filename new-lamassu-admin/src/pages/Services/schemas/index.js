import cryptx from './cryptx'
import bitgo from './bitgo'
import bitstamp from './bitstamp'
import blockcypher from './blockcypher'
import infura from './infura'
import itbit from './itbit'
import kraken from './kraken'
import mailgun from './mailgun'
import twilio from './twilio'

export default {
  [cryptx.code]: cryptx,
  [bitgo.code]: bitgo,
  [bitstamp.code]: bitstamp,
  [blockcypher.code]: blockcypher,
  [infura.code]: infura,
  [itbit.code]: itbit,
  [kraken.code]: kraken,
  [mailgun.code]: mailgun,
  [twilio.code]: twilio
}
