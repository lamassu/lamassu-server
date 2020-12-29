const base = require('./base')

const { utils } = require('lamassu-coins')
// const coinUtils = require('../../../coin-utils')
const cryptoRec = utils.getCryptoCurrency('ETH')
const defaultPort = cryptoRec.defaultPort

base.connect(`http://localhost:${defaultPort}`)

module.exports = base
