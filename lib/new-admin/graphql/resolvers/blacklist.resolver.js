const blacklist = require('../../../blacklist')

const resolvers = {
  Query: {
    blacklist: () => blacklist.getBlacklist()
  },
  Mutation: {
    deleteBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.deleteFromBlacklist(cryptoCode, address),
    insertBlacklistRow: (...[, { cryptoCode, address }]) =>
      blacklist.insertIntoBlacklist(cryptoCode, address)
  }
}

module.exports = resolvers
