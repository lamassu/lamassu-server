const _ = require('lodash/fp')
const base = require('../geth/base')

function run (account) {
  const endpoint = account.endpoint
  if (!endpoint) throw new Error('Need to configure API endpoint for Infura')

  base.connect(endpoint)
}

module.exports = _.merge(base, {run})
