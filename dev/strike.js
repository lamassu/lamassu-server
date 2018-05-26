const strike = require('../lib/plugins/wallet/strike/strike')
const BN = require('../lib/bn')

const account = {token: 'xxx'}

strike.newAddress(account, {cryptoCode: 'BTC', cryptoAtoms: BN(10000)})
  .then(r => {
    console.log(r)

    const toAddress = r
    const requested = null
    const cryptoCode = 'BTC'

    setInterval(() => {
      strike.getStatus(account, toAddress, requested, cryptoCode)
        .then(console.log)
        .catch(r => console.log(r.message))
    }, 2000)
  })
  .catch(console.log)
