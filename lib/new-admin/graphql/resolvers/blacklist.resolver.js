const blacklist = require('../../../blacklist')

const resolvers = {
  Query: {
    blacklist: () => blacklist.getBlacklist()
  },
  Mutation: {
    deleteBlacklistRow: (...[, { address }]) =>
      blacklist.deleteFromBlacklist(address),
    insertBlacklistRow: (...[, { address }]) =>
      blacklist.insertIntoBlacklist(address)
  }
}

module.exports = resolvers
