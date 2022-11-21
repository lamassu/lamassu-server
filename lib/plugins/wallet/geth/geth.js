const _ = require('lodash/fp')

const base = require('./base')

const { utils: coinUtils } = require('@lamassu/coins')
const cryptoRec = coinUtils.getCryptoCurrency('ETH')
const defaultPort = cryptoRec.defaultPort

const NAME = 'geth'

function run (account) {
  base.connect(`http://localhost:${defaultPort}`)
}

module.exports = _.merge(base, { NAME, run })
