const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')
const moment = require('moment')
const _ = require('lodash/fp')

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

const dateFormat = (timezone, logs) => _.map(log => {
  const offset = timezone.split(':')[1]
  return {
    ...log,
    created: moment.utc(log.created).utcOffset(parseInt(offset)).format('YYYY-MM-DDTHH:mm:ss.SSS'),
    sendTime: moment.utc(log.sendTime).utcOffset(parseInt(offset)).format('YYYY-MM-DDTHH:mm:ss.SSS')
  }
}, logs)

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
        .then(data => parseAsync(data, { fields: tx_logFields, transforms: dateFormat(timezone, data) })),
    transactionCsv: (...[, { id, txClass }]) =>
      transactions.getTx(id, txClass).then(data => parseAsync(data)),
    txAssociatedDataCsv: (...[, { id, txClass }]) =>
      transactions.getTxAssociatedData(id, txClass).then(data => parseAsync(data)),
    transactionFilters: () => filters.transaction()
  }
}

module.exports = resolvers
