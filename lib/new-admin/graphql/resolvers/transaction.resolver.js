const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')

const transactions = require('../../modules/transactions')
const anonymous = require('../../../constants').anonymousCustomer

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids))

const resolvers = {
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
  },
  Transaction: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    transactions: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset),
    transactionsCsv: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset).then(parseAsync)
  }
}

module.exports = resolvers
