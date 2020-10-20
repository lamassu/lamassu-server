import bchValidate from './bch'
import btcValidate from './btc'
import dashValidate from './dash'
import ethValidate from './eth'
import ltcValidate from './ltc'
import zecValidate from './zec'

const validatorFuncs = {
  BTC: btcValidate,
  DASH: dashValidate,
  LTC: ltcValidate,
  ZEC: zecValidate,
  ETH: ethValidate,
  BCH: bchValidate
}

export default validatorFuncs
