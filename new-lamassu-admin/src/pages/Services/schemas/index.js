import blockcypher from './blockcypher'
import infura from './infura'
import kraken from './kraken'
import twilio from './twilio'

export default {
  [blockcypher.code]: blockcypher,
  [infura.code]: infura,
  [kraken.code]: kraken,
  [twilio.code]: twilio
}
