const pairing = require('../../services/pairing')

const resolvers = {
  Mutation: {
    createPairingTotem: (...[, { name }]) => pairing.totem(name)
  }
}

module.exports = resolvers
