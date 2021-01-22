const pairing = require('../../modules/pairing')

const resolvers = {
  Mutation: {
    createPairingTotem: (...[, { name }]) => pairing.totem(name)
  }
}

module.exports = resolvers
