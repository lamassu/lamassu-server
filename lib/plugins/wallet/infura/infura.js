const _ = require('lodash/fp')
const base = require('../geth/base')
const T = require('../../../time')

const REGULAR_TX_POLLING = 5 * T.seconds

const NAME = 'infura'

function run (account) {
  if (!account.endpoint) throw new Error('Need to configure API endpoint for Infura')

  const endpoint = _.startsWith('https://')(account.endpoint)
    ? account.endpoint : `https://${account.endpoint}`

  base.connect(endpoint)
}

const txsCache = {}
setInterval(() => {
  _.forEach(it => {
    // A transaction not being updated for over an hour means that it stopped being fetched on poll,
    // which means that it probably was cancelled by the operator or something else caused the
    // transaction to stop being listened to. So, trim the cache to save memory
    const lastReq = _.isNil(txsCache[it].lastReqTime) ? Date.now() : new Date(txsCache[it].lastReqTime)
    const timePassedSinceReq = Date.now() - lastReq
    if (timePassedSinceReq > T.hour) delete txsCache[it]
  }, _.keys(txsCache))
}, T.minute)

function shouldGetStatus (tx) {
  const timePassedSinceTx = Date.now() - new Date(tx.created)
  const timePassedSinceReq = Date.now() - new Date(txsCache[tx.id].lastReqTime)
  
  // Allow for infura to gradually lower the amount of requests based on the time passed since the transaction
  // Until first 5 minutes - 1/2 regular polling speed
  // Until first 10 minutes - 1/4 regular polling speed
  // Until first hour - 1/8 polling speed
  // Until first two hours - 1/12 polling speed
  // Until first four hours - 1/16 polling speed
  // Until first day - 1/24 polling speed
  // After first day - 1/32 polling speed
  if (timePassedSinceTx < 5 * T.minutes) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 2 * REGULAR_TX_POLLING
  if (timePassedSinceTx < 10 * T.minutes) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 4 * REGULAR_TX_POLLING
  if (timePassedSinceTx < 1 * T.hour) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 8 * REGULAR_TX_POLLING
  if (timePassedSinceTx < 2 * T.hours) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 12 * REGULAR_TX_POLLING
  if (timePassedSinceTx < 4 * T.hours) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 16 * REGULAR_TX_POLLING
  if (timePassedSinceTx < 1 * T.day) return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 24 * REGULAR_TX_POLLING
  return _.isNil(txsCache[tx.id].res) || timePassedSinceReq > 32 * REGULAR_TX_POLLING
}

// Override geth's getStatus function to allow for different polling timing
function getStatus (account, tx, requested, settings, operatorId) {
  if (_.isNil(txsCache[tx.id])) {
    txsCache[tx.id] = { lastReqTime: Date.now() }
  }

  // return last available response
  if (!shouldGetStatus(tx)) {
    return Promise.resolve(txsCache[tx.id].res)
  }

  return base.getStatus(account, tx, requested, settings, operatorId)
    .then(res => {
      if (res.status === 'confirmed') {
        delete txsCache[tx.id] // Transaction reached final status, can trim it from the caching obj
      } else {
        txsCache[tx.id].lastReqTime = Date.now()
        txsCache[tx.id].res = res
      }
      return res
    })
}

module.exports = _.merge(base, { NAME, run, getStatus })
