#!/usr/bin/env node

var pgp = require('pg-promise')()
var psqlUrl = require('../lib/options').postgresql

var db = pgp(psqlUrl)

db.manyOrNone(`select * from transactions where incoming=false
  and stage='final_request' and authority='machine'`)
  .then(rs =>
    db.tx(t =>
      t.batch(rs.map(r => db.none(`insert into cash_in_txs (session_id,
      device_fingerprint, to_address, crypto_atoms, crypto_code, fiat,
      currency_code, fee, tx_hash, error, created) values ($1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11)`, [r.session_id, r.device_fingerprint,
        r.to_address, r.satoshis, r.crypto_code, r.fiat, r.currency_code, r.fee,
        r.tx_hash, r.error, r.created]))
      )
    )
  )
  .then(() => db.manyOrNone(`select * from transactions where incoming=true
  and stage='initial_request' and authority='pending'`))
  .then(rs =>
    db.tx(t =>
      t.batch(rs.map(r => db.none(`insert into cash_out_txs (session_id,
      device_fingerprint, to_address, crypto_atoms, crypto_code, fiat,
      currency_code, tx_hash, phone, error, created) values ($1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11)`, [r.session_id, r.device_fingerprint,
        r.to_address, r.satoshis, r.crypto_code, r.fiat, r.currency_code,
        r.tx_hash, r.phone, r.error, r.created]))
      )
    )
  )
  .then(() => db.manyOrNone(`select * from transactions where incoming=true
  and stage='dispense' and authority='authorized'`))
  .then(rs =>
    db.tx(t =>
      t.batch(rs.map(r =>
        db.none(`update cash_out_txs set dispensed=true where session_id=$1`, [r.session_id])
          .then(() => db.none(`insert into cash_out_actions (session_id, action,
      created) values ($1, $2, $3)`, [r.session_id, 'dispensed', r.created]))
      ))
    )
  )
  .then(() => pgp.end())
  .then(() => console.log('Success.'))
  .catch(e => {
    console.log(e)
    pgp.end()
  })
