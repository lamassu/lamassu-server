#!/usr/bin/env node

'use strict'

const pgp = require('pg-promise')()
const psqlUrl = require('../lib/options').postgresql

const db = pgp(psqlUrl)

db.one('select data from user_config where type=$1', 'exchanges')
.then(data => {
  const config = data.data
  const settings = config.exchanges.settings
  const compliance = settings.compliance
  const newConfig = {
    global: {
      cashInTransactionLimit: compliance.maximum.limit,
      cashOutTransactionLimit: settings.fiatTxLimit,
      cashInCommission: settings.commission,
      cashOutCommission: settings.fiatCommission || settings.commission,
      idVerificationEnabled: compliance.idVerificationEnabled,
      idVerificationLimit: compliance.idVerificationLimit,
      lowBalanceMargin: settings.lowBalanceMargin,
      zeroConfLimit: settings.zeroConfLimit
    }
  }

  db.none('insert into user_config (type, data) values ($1, $2)', ['global', newConfig])
  .then(() => {
    console.log('Success.')
    process.exit(0)
  })
  .catch(err => {
    console.log('Error: %s', err)
    process.exit(1)
  })
})
