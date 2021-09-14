const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')
const _ = require('lodash/fp')

const filters = require('../../filters')
const cashOutTx = require('../../../cash-out/cash-out-tx')
const cashInTx = require('../../../cash-in/cash-in-tx')
const transactions = require('../../services/transactions')
const anonymous = require('../../../constants').anonymousCustomer
const logDateFormat = require('../../../logs').logDateFormat

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids))
const txLogFields = ['txClass', 'id', 'deviceId', 'toAddress', 'cryptoAtoms',
  'cryptoCode', 'fiat', 'fiatCode', 'fee', 'status',
  'dispense', 'notified', 'redeem', 'phone', 'error',
  'created', 'confirmedAt', 'hdIndex', 'swept', 'timedout',
  'dispenseConfirmed', 'provisioned1', 'provisioned2',
  'denomination1', 'denomination2', 'errorCode', 'customerId',
  'txVersion', 'publishedAt', 'termsAccepted', 'layer2Address',
  'commissionPercentage', 'rawTickerPrice', 'receivedCryptoAtoms',
  'discount', 'txHash', 'customerPhone', 'customerIdCardDataNumber',
  'customerIdCardDataExpiration', 'customerIdCardData', 'customerName',
  'customerFrontCameraPath', 'customerIdCardPhotoPath', 'expired', 'machineName']

const resolvers = {
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
  },
  Transaction: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    transactions: (...[, { from, until, limit, offset, deviceId, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status }]) =>
      transactions.batch(from, until, limit, offset, deviceId, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status),
    transactionsCsv: (...[, { from, until, limit, offset, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, timezone, simplified }]) =>
      transactions.batch(from, until, limit, offset, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status, simplified)
        .then(data => parseAsync(logDateFormat(timezone, data, ['created', 'sendTime']), { fields: txLogFields })),
    transactionCsv: (...[, { id, txClass, timezone }]) =>
      transactions.getTx(id, txClass).then(data => 
        parseAsync(logDateFormat(timezone, [data], ['created', 'sendTime']))
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
