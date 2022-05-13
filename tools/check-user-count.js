#!/usr/bin/env node

require('../lib/environment-helper')
const db = require('../lib/db')

const getCount = () => {
  return db.one(`SELECT COUNT(*) FROM users`)
    .then(res => {
      process.stdout.write(res.count)
      process.exit(0)
    })
}

getCount()
