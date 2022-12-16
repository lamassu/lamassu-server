const pairing = require('../../services/pairing')

const resolvers = {
  Mutation: {
    createPairingTotem: (parent, { name }, { res }, info) => pairing.totem(name, res.locals.operatorId)
  }
}

module.exports = resolvers
