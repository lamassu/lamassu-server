const base = require('./base')

const { utils: coinUtils } = require('lamassu-coins')
const cryptoRec = coinUtils.getCryptoCurrency('ETH')
const defaultPort = cryptoRec.defaultPort

base.connect(`http://localhost:${defaultPort}`)

module.exports = base
