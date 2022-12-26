const blacklist = require('../../../blacklist')

const resolvers = {
  Query: {
    blacklist: () => blacklist.getBlacklist(),
    blacklistMessages: () => blacklist.getMessages()
  },
  Mutation: {
    deleteBlacklistRow: (...[, { address }]) =>
      blacklist.deleteFromBlacklist(address),
    insertBlacklistRow: (...[, { address }]) =>
      blacklist.insertIntoBlacklist(address),
    editBlacklistMessage: (...[, { id, content }]) =>
      blacklist.editBlacklistMessage(id, content)
  }
}

module.exports = resolvers
