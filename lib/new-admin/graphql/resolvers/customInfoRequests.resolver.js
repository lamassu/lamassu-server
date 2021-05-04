const resolvers = {
  Query: {
    customInfoRequests: () => Promise.resolve().then(() => [{ id: 'idhere', enabled: true, customRequest: { type: 'test' } }])
  },
  Mutation: {
    insertCustomInfoRequest: (data) => { console.log('a', data); return Promise.resolve().then(() => true) }
  }
}

module.exports = resolvers
