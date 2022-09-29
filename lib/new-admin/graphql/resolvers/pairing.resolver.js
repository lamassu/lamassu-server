const pairing = require('../../services/pairing')
const machine = require('../../../machine-loader')

const resolvers = {
  Mutation: {
    createPairingTotem: (...[, { name, location }]) => machine.createMachineLocation(location)
      .then(() => pairing.totem(name, location))
  }
}

module.exports = resolvers
