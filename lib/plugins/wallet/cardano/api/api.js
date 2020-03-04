const BN = require('../../../../bn')
const assert = require('assert')

class CardanoApi {
  constructor(fetcher) {
    // TODO: maybe add assert to instaceof
    this.fetcher = fetcher
  }

  async walletBalance(walletId, index, minConfirmations = 1) {
    return this.fetcher
      .fetchAllPages('transactions', {
        wallet_id: walletId,
        per_page: CardanoApi.PER_PAGE_MAXIMUM,
        account_index: index // TODO: ues this or not? we will count all deposit on wallet or only for one index?
      })
      .then(transactions =>
        transactions
          .map(item => {
            const sign = { incoming: +1, outgoing: -1 }[item.direction]
            return {
              isConfirmed: item.confirmations >= minConfirmations,
              amount: BN(item.amount).mul(sign)
            }
          })
          .reduce(
            (acc, item) => ({
              confirmed: acc.confirmed.plus(item.isConfirmed ? item.amount : 0),
              total: acc.total.plus(item.amount)
            }),
            {
              confirmed: BN(0),
              total: BN(0)
            }
          )
      )
  }

  sumAmountByAddress(movements, address) {
    return movements
      .filter(movement => movement.address === address)
      .map(movement => BN(movement.amount))
      .reduce((acc, amount) => acc.add(amount), BN(0))
  }

  async addressBalance(
    address,
    minConfirmations,
    mode = CardanoApi.INCLUDE_ALL_TRANSACTIONS
  ) {
    return this.fetcher
      .fetchAllPages('transactions', {
        address: address,
        per_page: CardanoApi.PER_PAGE_MAXIMUM
      })
      .then(transactions =>
        transactions
          .map(transaction => {
            let amount = BN(0)

            // outcome transfer from selected `address` is represented in transaction as INPUT
            if ((mode & CardanoApi.INCLUDE_OUTCOME_TRANSACTIONS) !== 0) {
              amount = amount.minus(this.sumAmountByAddress(transaction.inputs, address))
            }

            // income transfer from selected `address` is represented in transaction as OUTPUT
            if ((mode & CardanoApi.INCLUDE_INCOME_TRANSACTIONS) !== 0) {
              amount = amount.plus(this.sumAmountByAddress(transaction.outputs, address))
            }

            return {
              isConfirmed: transaction.confirmations >= minConfirmations,
              amount
            }
          })
          .reduce(
            (acc, item) => ({
              confirmed: acc.confirmed.plus(item.isConfirmed ? item.amount : 0),
              total: acc.total.plus(item.amount)
            }),
            {
              confirmed: BN(0),
              total: BN(0)
            }
          ))
  }

  async sendCoins(walletId, accountIndex, address, cryptoAtoms) {
    assert(cryptoAtoms.lte(Number.MAX_SAFE_INTEGER))

    return this.fetcher
      .fetch('transactions', null, {
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
      })
      .then(data => {
        const inputs = data.inputs.reduce(
          (acc, item) => acc.plus(BN(item.amount)),
          BN(0)
        )
        const outputs = data.outputs.reduce(
          (acc, item) => acc.plus(BN(item.amount)),
          BN(0)
        )

        return {
          fee: inputs.minus(outputs),
          txid: data.id
        }
      })
  }

  async newWallet(mnemonic, name = 'Server Wallet', operation = 'create') {
    return this.fetcher
      .fetch('wallets', null, {
        assuranceLevel: 'normal',
        backupPhrase: mnemonic,
        name,
        operation
      })
      .then(data => data.id)
      .catch(e => {
        // FUTURE TODO: axios 0.19 has e.isAxiosError, but we use 0.16
        if (typeof e.response !== 'undefined' && e.response.status === 403) {
          // Wallet already exists
          return e.response.data.diagnostic.walletId
        }

        throw e
      })
  }

  async newAccount(walletId, name = 'Main') {
    return this.fetcher
      .fetch(`wallets/${walletId}/accounts`, null, {
        name
      })
      .then(data => data.index)
  }

  async newAddress(walletId, index) {
    return this.fetcher
      .fetch('addresses', null, {
        accountIndex: index,
        walletId
      })
      .then(data => data.id)
  }
}

CardanoApi.INCLUDE_INCOME_TRANSACTIONS  = 1 << 0
CardanoApi.INCLUDE_OUTCOME_TRANSACTIONS = 1 << 1
CardanoApi.INCLUDE_ALL_TRANSACTIONS =
  CardanoApi.INCLUDE_INCOME_TRANSACTIONS |
  CardanoApi.INCLUDE_OUTCOME_TRANSACTIONS

CardanoApi.PER_PAGE_MAXIMUM = 50

module.exports = CardanoApi
