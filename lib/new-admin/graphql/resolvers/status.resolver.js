const supervisor = require('../../modules/supervisor')

const resolvers = {
  Query: {
    uptime: () => supervisor.getAllProcessInfo()
  }
}

module.exports = resolvers
