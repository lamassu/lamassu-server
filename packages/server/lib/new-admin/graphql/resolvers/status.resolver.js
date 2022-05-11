const supervisor = require('../../services/supervisor')

const resolvers = {
  Query: {
    uptime: () => supervisor.getAllProcessInfo()
  }
}

module.exports = resolvers
