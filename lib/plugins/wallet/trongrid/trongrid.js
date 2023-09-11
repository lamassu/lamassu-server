const _ = require('lodash/fp')
const base = require('../tron/base')

const NAME = 'trongrid'

function run (account) {
  if (!account.endpoint) throw new Error('Need to configure API endpoint for trongrid')

  const endpoint = 'https://api.trongrid.io'

  base.connect({ ...account, endpoint })
}

module.exports = _.merge(base, { NAME, run })
