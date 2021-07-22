#!/usr/bin/env node

'use strict'

const pgp = require('pg-promise')()
const psqlUrl = require('../lib/options').postgresql

const db = pgp(psqlUrl)

db.many('select data from user_config', 'exchanges')
  .then(rows => {
    const config = rows.filter(r => r.type === 'exchanges')[0].data
    const brain = rows.filter(r => r.type === 'unit')[0].data
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
        zeroConfLimit: settings.zeroConfLimit,
        fiatCurrency: settings.currency,
        topCashOutDenomination: settings.cartridges[0],
        bottomCashOutDenomination: settings.cartridges[1],
        virtualCashOutDenomination: settings.virtualCartridges[0],
        machineLanguages: brain.locale.localeInfo.primaryLocales,
        coins: settings.coins
      },
      accounts: settings.plugins.settings
    }

    db.none('insert into user_config (type, data) values ($1, $2)', ['global', newConfig])
      .then(() => {
        console.log('Success.')
        process.exit(0)
      })
      .catch(err => {
        console.error('Error: %s', err)
        process.exit(1)
      })
  })
