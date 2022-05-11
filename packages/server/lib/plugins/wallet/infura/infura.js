const _ = require('lodash/fp')
const base = require('../geth/base')

function run (account) {
  if (!account.endpoint) throw new Error('Need to configure API endpoint for Infura')

  const endpoint = _.startsWith('https://')(account.endpoint)
    ? account.endpoint : `https://${account.endpoint}`

  base.connect(endpoint)
}

module.exports = _.merge(base, {run})
