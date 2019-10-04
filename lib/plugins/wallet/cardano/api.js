const BN = require('../../../bn')

const unitScale = 6

class CardanoAPI {
  constructor(client, port, hostname = 'localhost') {
    this.client = client
    this.port = port
    this.hostname = hostname
  }

  async fetch(endpoint, params, data, appendData = []) {
    const method = data ? 'POST' : 'GET'

    const url = `https://${this.hostname}:${this.port}/api/v1/${endpoint}`

    return Promise.resolve(true)
      .then(() => {
        return this.client({
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
          return this.fetch(
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

  async walletBalance(walletId, index, confirmations = 1) {
    return this.fetch('transactions', {
      walletId,
      accountIndex: index
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

  async addressBalance(address, confirmations) {
    return this.fetch('transactions', {
      address: address
    })
      .then(transactions =>
        transactions.reduce((acc, item) => {
          const inputs = item.inputs
            .filter(
              record =>
                record.address === address &&
                item.confirmations >= confirmations
            )
            .reduce((acc, item) => acc + item.amount, 0)

          const outputs = item.outputs
            .filter(
              record =>
                record.address === address &&
                item.confirmations >= confirmations
            )
            .reduce((acc, item) => acc + item.amount, 0)

          return acc + outputs - inputs
        }, 0)
      )
      .then(balance =>
        BN(balance)
          .shift(unitScale)
          .round()
      ) // TODO: is that shift really need?
  }

  async sendCoins(walletId, accountIndex, address, cryptoAtoms) {
    return this.fetch('transactions', null, {
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
          .round(), // TODO: is that shift really need?
        txid: data.id
      }
    })
  }

  async newWallet(mnemonic, name = 'Server Wallet', operation = 'create') {
    return this.fetch('wallets', null, {
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

  async newAccount(walletId, name = 'Main') {
    return this.fetch(`wallets/${walletId}/accounts`, {
      name
    }).then(data => data[0].index) // TODO: check why here is array instead of object
  }

  async newAddress(walletId, index) {
    return this.fetch('addresses', null, {
      accountIndex: index,
      walletId
    }).then(data => data.id)
  }
}

module.exports = CardanoAPI
