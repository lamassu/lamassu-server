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
    insertCustomInfoRequest: (data) => { console.log('a', data); return Promise.resolve().then(() => true) }
  }
}

module.exports = resolvers
