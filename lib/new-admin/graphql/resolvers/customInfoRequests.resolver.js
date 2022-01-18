const authentication = require('../modules/userManagement')
const queries = require('../../services/customInfoRequests')
const DataLoader = require('dataloader')

const customerCustomInfoRequestsLoader = new DataLoader(ids => queries.batchGetAllCustomInfoRequestsForCustomer(ids), { cache: false })

const customInfoRequestLoader = new DataLoader(ids => queries.batchGetCustomInfoRequest(ids), { cache: false })

const resolvers = {
  Customer: {
    customInfoRequests: parent => customerCustomInfoRequestsLoader.load(parent.id)
  },
  CustomRequestData: {
    customInfoRequest: parent => customInfoRequestLoader.load(parent.infoRequestId)
  },
  Query: {
    customInfoRequests: (...[, { onlyEnabled }]) => queries.getCustomInfoRequests(onlyEnabled),
    customerCustomInfoRequests: (...[, { customerId }]) => queries.getAllCustomInfoRequestsForCustomer(customerId),
    customerCustomInfoRequest: (...[, { customerId, infoRequestId }]) => queries.getCustomInfoRequestForCustomer(customerId, infoRequestId)
  },
  Mutation: {
    insertCustomInfoRequest: (...[, { customRequest }]) => queries.addCustomInfoRequest(customRequest),
    removeCustomInfoRequest: (...[, { id }]) => queries.removeCustomInfoRequest(id),
    editCustomInfoRequest: (...[, { id, customRequest }]) => queries.editCustomInfoRequest(id, customRequest),
    setAuthorizedCustomRequest: (...[, { customerId, infoRequestId, override }, context]) => {
      const token = authentication.getToken(context)
      return queries.setAuthorizedCustomRequest(customerId, infoRequestId, override, token)
    },
    setCustomerCustomInfoRequest: (...[, { customerId, infoRequestId, data }]) => queries.setCustomerData(customerId, infoRequestId, data)
  }
}

module.exports = resolvers
