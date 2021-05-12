const queries = require('../../services/customInfoRequests')
const DataLoader = require('dataloader')

const customInfoRequestsLoader = new DataLoader(ids => queries.batchGetAllCustomInfoRequestsForCustomer(ids), { cache: false })

const resolvers = {
  Customer: {
    customInfoRequests: parent => customInfoRequestsLoader.load(parent.id)
  },
  Query: {
    customInfoRequests: (...[, { onlyEnabled }]) => queries.getCustomInfoRequests(onlyEnabled),
    customerCustomInfoRequests: (...[, { customerId }]) => queries.getAllCustomInfoRequestsForCustomer(customerId),
    customerCustomInfoRequest: (...[, { customerId, infoRequestId }]) => queries.getCustomInfoRequestForCustomer(customerId, infoRequestId)
  },
  Mutation: {
    insertCustomInfoRequest: (...[, { customRequest }]) => queries.addCustomInfoRequest(customRequest),
    removeCustomInfoRequest: (...[, { id }]) => queries.removeCustomInfoRequest(id),
    editCustomInfoRequest: (...[, { id, customRequest }]) => queries.editCustomInfoRequest(id, customRequest)
  }
}

module.exports = resolvers
