const base = require('./base')

const coinUtils = require('../../../coin-utils')
const cryptoRec = coinUtils.getCryptoCurrency('ETH')
const defaultPort = cryptoRec.defaultPort

base.connect(`http://localhost:${defaultPort}`)

module.exports = base
