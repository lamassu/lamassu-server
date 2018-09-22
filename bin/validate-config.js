'use strict'

const db = require('../lib/db')
const configValidate = require('../lib/config-validate')

function pp (o) {
  console.log(require('util').inspect(o, {depth: null, colors: true}))
}

function dbFetchConfig () {
  return db.oneOrNone(
    'select data from user_config where type=$1 order by created desc limit 1',
    ['config']
  )
    .then(row => row && row.data)
}

dbFetchConfig()
  .then(config => {
    pp(config)
    return configValidate.validate(config.config)
  })
  .then(() => {
    console.log('success.')
    process.exit(0)
  })
  .catch(e => {
    console.log(e)
    process.exit(1)
  })
