const axios = require('axios')
const https = require('https')
const fs = require('fs')

const BN = require('../../../bn')
const coinUtils = require('../../../coin-utils')

const cryptoRec = coinUtils.getCryptoCurrency('ADA')
const cryptoDir = coinUtils.cryptoDir(cryptoRec)
const unitScale = 6

// how remove depedency on $cryptoDir out?
const httpsAgent = new https.Agent({
  ca: fs.readFileSync(`${cryptoDir}/tls/client/ca.crt`),
  cert: fs.readFileSync(`${cryptoDir}/tls/client/client.crt`),
  key: fs.readFileSync(`${cryptoDir}/tls/client/client.key`)
})
const httpsAxios = axios.create({ httpsAgent })

function fetch(endpoint, params, data, appendData = []) {
  const method = data ? 'POST' : 'GET'

  const url = `https://localhost:${cryptoRec.defaultPort}/api/v1/${endpoint}`

  return Promise.resolve(true)
    .then(() => {
      return httpsAxios({
        method,
        url,
        params,
        data
      })
    })
    .then(response => {
      if (response.error) throw r.error

      const responseData = Array.isArray(response.data.data)
        ? [...response.data.data, ...appendData]
        : response.data.data

      if (
        method === 'GET' &&
        response.data.meta.pagination.totalPages >
          response.data.meta.pagination.page
      ) {
        return fetch(
          endpoint,
          {
            ...params,
            page: (params.page || 1) + 1
          },
          data,
          responseData
        )
      }

      return responseData
    })
}

function walletBalance(walletId, confirmations = 1) {
  return fetch('transactions', {
    walletId
  })
    .then(transactions =>
      transactions.reduce((acc, item) => {
        if (item.confirmations < confirmations) {
          return acc
        }

        return acc + (item.direction === 'outgoing' ? -1 : 1) * item.amount
      }, 0)
    )
    .then(r => BN(r).round())
}

function addressBalance(address, confirmations) {
  return fetch('transactions', {
    address: address
  })
    .then(transactions =>
      transactions.reduce((acc, item) => {
        const inputs = item.inputs
          .filter(
            record =>
              record.address === address && item.confirmations >= confirmations
          )
          .reduce((acc, item) => acc + item.amount, 0)

        const outputs = item.outputs
          .filter(
            record =>
              record.address === address && item.confirmations >= confirmations
          )
          .reduce((acc, item) => acc + item.amount, 0)

        return acc + outputs - inputs
      }, 0)
    )
    .then(balance =>
      BN(balance)
        .shift(unitScale)
        .round()
    ) // je tu potreba ten shift?
}

function sendCoins(walletId, accountIndex, address, cryptoAtoms) {
  return fetch('transactions', null, {
    destinations: [
      {
        amount: cryptoAtoms.toNumber(),
        address
      }
    ],
    source: {
      accountIndex,
      walletId
    },
    groupingPolicy: 'OptimizeForHighThroughput'
  }).then(data => {
    const inputs = data.inputs.reduce((acc, item) => acc + item.amount, 0)
    const outputs = data.outputs.reduce((acc, item) => acc + item.amount, 0)

    return {
      fee: BN(inputs - outputs)
        .abs()
        .shift(unitScale)
        .round(), // je tu potreba ten shift??
      txid: data.id
    }
  })
}

function newWallet(mnemonic, name = 'Server Wallet', operation = 'create') {
  return fetch('wallets', null, {
    assuranceLevel: 'normal',
    backupPhrase: mnemonic,
    name,
    operation
  })
    .then(data => data.id)
    .catch(e => {
      if (e.response.status === 403) {
        // Wallet already exists
        return e.response.data.diagnostic.walletId
      }

      throw e
    })
}

function newAccount(walletId, name = 'Main') {
  return fetch(`wallets/${walletId}/accounts`, {
    name
  })
    // TODO: check why here is array instead of object
    .then(data => data[0].index)
}

function newAddress(walletId, index) {
  return fetch('addresses', null, {
    accountIndex: index,
    walletId
  })
    .then(data => data.id)
}

module.exports = {
  walletBalance,
  sendCoins,
  newWallet,
  newAccount,
  newAddress,
  addressBalance
}
