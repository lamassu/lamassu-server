const lnd = require('lnd-async')

const BN = require('../../../bn')
const E = require('../../../error')
const coinUtils = require('../../../coin-utils')
const options = require('../../../options')

const _ = require('lodash/fp')

const cryptoRec = coinUtils.getCryptoCurrency('BTC')
const unitScale = cryptoRec.unitScale

module.exports = {
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork
}

function connect () {
  return lnd.connect(options.lnd || {})
}

function cryptoNetwork (account, cryptoCode) {
  return Promise.resolve('main')
}

function checkCryptoCode (cryptoCode) {
  if (cryptoCode !== 'BTC') return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  return Promise.resolve()
}

function balance (acount, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(connect)
    .then(c => c.channelBalance({}))
    .then(_.get('balance'))
    .then(BN)
    .then(r => r.shift(unitScale).round())
}

function sendCoins (account, address, cryptoAtoms, cryptoCode) {
  // Not implemented yet
  return Promise.reject(new E.NotImplementedError())
}

function newFunding (account, cryptoCode) {
  // Not implemented yet
  return Promise.reject(new E.NotImplementedError())
}

function newAddress (account, info) {
  return checkCryptoCode(info.cryptoCode)
    .then(connect)
    .then(c => {
      if (info.isLightning) {
        return c.addInvoice({memo: 'Lamassu cryptomat deposit', value: info.cryptoAtoms.toNumber()})
          .then(r => `${r.r_hash.toString('hex')}:${r.payment_request}`)
      }

      return c.newAddress({type: 2})
        .then(_.get('address'))
    })
}

function getStatus (account, toAddress, requested, cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => {
      const parts = _.split(':', toAddress)
      const isLightning = _.size(parts) === 2
      const rHashStr = isLightning && _.head(parts)

      return connect()
        .then(c => {
          return c.lookupInvoice({r_hash_str: rHashStr})
            .then(r => {
              if (r.settled) return {status: 'confirmed'}
              return {status: 'notSeen'}
            })
        })
    })
}
