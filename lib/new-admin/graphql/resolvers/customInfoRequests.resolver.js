const queries = require('../../services/customInfoRequests')

const resolvers = {
  Query: {
    customInfoRequests: () => queries.getCustomInfoRequests().then(res => {
      return res.map(item => ({
        id: item.id,
        enabled: item.enabled,
        customRequest: item.custom_request
      }))
    })
  },
  Mutation: {
    insertCustomInfoRequest: (...[, { customRequest }]) => queries.addCustomInfoRequest(customRequest),
    removeCustomInfoRequest: (...[, { id }]) => queries.removeCustomInfoRequest(id),
    editCustomInfoRequest: (...[, { id, customRequest }]) => queries.editCustomInfoRequest(id, customRequest)
  }
}

module.exports = resolvers
