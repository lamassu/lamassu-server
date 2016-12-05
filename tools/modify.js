'use strict'

const R = require('ramda')
const db = require('../db')

function pp (o) {
  console.log(require('util').inspect(o, {depth: null, colors: true}))
}

function dbFetchConfig () {
  return db.oneOrNone('select data from user_config where type=$1', ['config'])
  .then(row => row && row.data)
}

dbFetchConfig()
.then(c => {
  const groups = c.groups
  .filter(g => g.code !== 'fiat')
  .map(g => {
    if (g.code === 'currencies') {
      const values = g.values.filter(v => v.fieldLocator.code !== 'cryptoCurrencies')
      return R.assoc('values', values, g)
    }

    return g
  })

  return {groups: groups}
})
.then(config => {
  pp(config)
  return db.none('update user_config set data=$1 where type=$2', [config, 'config'])
})
.then(() => {
  process.exit(0)
})
.catch(e => {
  console.log(e)
  process.exit(1)
})
