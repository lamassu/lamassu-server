const pairing = require('../../services/pairing')

const resolvers = {
  Mutation: {
    createPairingTotem: (...[, { name }, context]) => pairing.totem(name, context)
  }
}

module.exports = resolvers
