const _ = require('lodash/fp')
const base = require('../geth/base')

function run (account) {
  const apiKey = account.apiKey
  if (!apiKey) throw new Error('Need to configure API key for Infura')

  base.connect(`https://mainnet.infura.io/${apiKey}`)
}

module.exports = _.merge(base, {run})
