#!/usr/bin/env node

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const db = require('../lib/db')

const getCount = () => {
  return db.one(`SELECT COUNT(*) FROM users`)
    .then(res => {
      process.stdout.write(res.count)
      process.exit(0)
    })
}

getCount()
