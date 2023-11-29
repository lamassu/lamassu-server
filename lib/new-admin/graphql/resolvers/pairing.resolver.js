const pairing = require('../../services/pairing')
const machine = require('../../../machine-loader')

const resolvers = {
  Mutation: {
    createPairingTotem: (parent, { name, location }, { res }, info) => machine.createMachineLocation(location)
      .then(locationId => pairing.totem(name, res.locals.operatorId, locationId))
  }
}

module.exports = resolvers
