const _ = require('lodash/fp')
const base = require('../tron/base')

const NAME = 'trongrid'

function run (account) {
  if (!account.endpoint) throw new Error('Need to configure API endpoint for Infura')

  const endpoint = _.startsWith('https://')(account.endpoint)
    ? account.endpoint : `https://${account.endpoint}`

  base.connect(endpoint)
}

module.exports = _.merge(base, { NAME, run })
