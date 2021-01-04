const base = require('./base')

const { utils } = require('lamassu-coins')
const cryptoRec = utils.getCryptoCurrency('ETH')
const defaultPort = cryptoRec.defaultPort

base.connect(`http://localhost:${defaultPort}`)

module.exports = base
