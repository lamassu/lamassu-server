#!/usr/bin/env node

const migrate = require('../lib/migrate-options')

migrate.run()
  .then(() => {
    console.log('lamassu.json Migration succeeded.')
    process.exit(0)
  })
  .catch(err => {
    console.error('lamassu.json Migration failed: %s', err)
    process.exit(1)
  })
