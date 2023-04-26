const modelPrettifier = {
  douro1: 'Douro',
  sintra: 'Sintra',
  gaia: 'Gaia',
  tejo: 'Tejo',
  aveiro: 'Aveiro',
  grandola: 'Grândola'
}

const cashUnitCapacity = {
  grandola: {
    cashbox: 2000,
    recycler: 2800
  },
  aveiro: {
    cashbox: 1500,
    stacker: 60,
    escrow: 20,
    cassette: 500
  },
  tejo: {
    // TODO: add support for the different cashbox configuration in Tejo
    cashbox: 1000,
    cassette: 500
  },
  gaia: {
    cashbox: 600
  },
  sintra: {
    cashbox: 1000,
    cassette: 500
  }
}

export { modelPrettifier, cashUnitCapacity }
