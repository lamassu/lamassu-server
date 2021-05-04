const DataLoader = require('dataloader')
const { parseAsync } = require('json2csv')

const transactions = require('../../services/transactions')
const anonymous = require('../../../constants').anonymousCustomer

const transactionsLoader = new DataLoader(ids => transactions.getCustomerTransactionsBatch(ids))
const tx_logFields = ["txClass", "id", "deviceId", "toAddress", "cryptoAtoms", 
                   "cryptoCode", "fiat", "fiatCode", "fee", "status", 
                   "dispense", "notified", "redeem", "phone", "error",
                   "created", "confirmedAt", "hdIndex", "swept", "timedout",
                   "dispenseConfirmed", "provisioned1", "provisioned2", 
                   "denomination1", "denomination2", "errorCode", "customerId",
                   "txVersion", "publishedAt", "termsAccepted", "layer2Address",
                   "commissionPercentage", "rawTickerPrice", "receivedCryptoAtoms",
                   "discount", "txHash", "customerPhone", "customerIdCardDataNumber",
                   "customerIdCardDataExpiration", "customerIdCardData", "customerName",
                   "customerFrontCameraPath", "customerIdCardPhotoPath", "expired", "machineName"]

const resolvers = {
  Customer: {
    transactions: parent => transactionsLoader.load(parent.id)
  },
  Transaction: {
    isAnonymous: parent => (parent.customerId === anonymous.uuid)
  },
  Query: {
    transactions: (...[, { from, until, limit, offset, deviceId }]) =>
      transactions.batch(from, until, limit, offset, deviceId),
    transactionsCsv: (...[, { from, until, limit, offset }]) =>
      transactions.batch(from, until, limit, offset).then(data => parseAsync(data, {fields: tx_logFields}))
  }
}

module.exports = resolvers
