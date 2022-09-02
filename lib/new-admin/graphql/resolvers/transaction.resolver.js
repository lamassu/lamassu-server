const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')
const _ = require('lodash/fp')

const filters = require('../../filters')
const cashOutTx = require('../../../cash-out/cash-out-tx')
const cashInTx = require('../../../cash-in/cash-in-tx')
const transactions = require('../../services/transactions')
const anonymous = require('../../../constants').anonymousCustomer
const logDateFormat = require('../../../logs').logDateFormat

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids), { cache: false })

const resolvers = {
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
  },
  Transaction: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    transactions: (...[, { from, until, limit, offset, deviceId, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, swept, excludeTestingCustomers }]) =>
      transactions.batch(from, until, limit, offset, deviceId, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, swept, excludeTestingCustomers),
    transactionsCsv: (...[, { from, until, limit, offset, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, swept, timezone, excludeTestingCustomers, simplified }]) =>
      transactions.batch(from, until, limit, offset, null, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, swept, excludeTestingCustomers, simplified)
        .then(data => parseAsync(logDateFormat(timezone, data, ['created', 'sendTime', 'publishedAt']))),
    transactionCsv: (...[, { id, txClass, timezone }]) =>
      transactions.getTx(id, txClass).then(data => 
        parseAsync(logDateFormat(timezone, [data], ['created', 'sendTime', 'publishedAt']))
      ),
    txAssociatedDataCsv: (...[, { id, txClass, timezone }]) =>
      transactions.getTxAssociatedData(id, txClass).then(data =>
        parseAsync(logDateFormat(timezone, data, ['created']))
      ),
    transactionFilters: () => filters.transaction()
  },
  Mutation: {
    cancelCashOutTransaction: (...[, { id }]) => cashOutTx.cancel(id),
    cancelCashInTransaction: (...[, { id }]) => cashInTx.cancel(id)
  }
}

module.exports = resolvers
