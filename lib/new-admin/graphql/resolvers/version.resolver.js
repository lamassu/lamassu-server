const serverVersion = require('../../../../package.json').version

const resolvers = {
  Query: {
    serverVersion: () => serverVersion
  }
}

module.exports = resolvers
