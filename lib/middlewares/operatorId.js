const pify = require('pify')
const fs = pify(require('fs'))
const hkdf = require('futoin-hkdf')

const state = require('./state')
const mnemonicHelpers = require('../mnemonic-helpers')
const options = require('../options')

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

function findOperatorId (req, res, next) {
  getMnemonic().then(mnemonic => {
    return computeOperatorId(mnemonicHelpers.toEntropyBuffer(mnemonic))
  }).then(id => {
    res.locals.operatorId = id
  }).catch(e => console.error('Error while computing operator id\n' + e))
  next()
}

module.exports = findOperatorId
