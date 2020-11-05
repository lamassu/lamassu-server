const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')

const filters = require('../../filters')
const transactions = require('../../services/transactions')
const anonymous = require('../../../constants').anonymousCustomer

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
    transactionsCsv: (...[, { from, until, limit, offset, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status }]) =>
      transactions.batch(from, until, limit, offset, txClass, machineName, customerName, fiatCode, cryptoCode, toAddress, status)
        .then(data => parseAsync(data, {fields: tx_logFields})),
    transactionCsv: (...[, { id, txClass }]) =>
      transactions.getTx(id, txClass).then(parseAsync),
    txAssociatedDataCsv: (...[, { id, txClass }]) =>
      transactions.getTxAssociatedData(id, txClass).then(parseAsync),
    transactionFilters: () => filters.transaction()
  }
}

module.exports = resolvers
