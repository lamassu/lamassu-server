var db = require('./db')
const pify = require('pify')
const fs = pify(require('fs'))
const hkdf = require('futoin-hkdf')

const state = require('../lib/middlewares/state')
const mnemonicHelpers = require('../lib/mnemonic-helpers')
const options = require('../lib/options')

function computeOperatorId (masterSeed) {
  return hkdf(masterSeed, 16, { salt: 'lamassu-server-salt', info: 'operator-id' }).toString('hex')
}

function getMnemonic () {
  if (state.mnemonic) return Promise.resolve(state.mnemonic)
  return fs.readFile(options.mnemonicPath, 'utf8').then(mnemonic => {
    state.mnemonic = mnemonic
    return mnemonic
  })
}

function generateOperatorId () {
  return getMnemonic().then(mnemonic => {
    return computeOperatorId(mnemonicHelpers.toEntropyBuffer(mnemonic))
  }).then(id => {
    return id
  }).catch(e => {
    console.error('Error while computing operator id\n' + e)
    throw e
  })
}

exports.up = function (next) {
  const sql =
    [
      `CREATE TABLE operator_ids (
        id serial PRIMARY KEY,
        operator_id TEXT NOT NULL,
        service TEXT NOT NULL
      )`
    ]
  generateOperatorId()
    .then(operatorId => {
      const sql2 = [
        `INSERT INTO operator_ids (operator_id, service) VALUES ('${operatorId}','middleware')`,
        `INSERT INTO operator_ids (operator_id, service) VALUES ('${operatorId}','coinatmradar')`,
        `INSERT INTO operator_ids (operator_id, service) VALUES ('${operatorId}','authentication')`
      ]
      db.multi(sql.concat(sql2), next)
        .then(() => next())
    })
    .catch(e => {
      db.multi(sql, next)
        .then(() => next())
    })
}

exports.down = function (next) {
  next()
}
