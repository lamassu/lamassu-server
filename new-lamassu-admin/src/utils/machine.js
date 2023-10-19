const modelPrettifier = {
  douro1: 'Douro',
  sintra: 'Sintra',
  gaia: 'Gaia',
  tejo: 'Tejo',
  aveiro: 'Aveiro',
  grandola: 'Grândola'
}

const cashUnitCapacity = {
  default: {
    cashbox: 600,
    cassette: 500
  },
  douro: {
    cashbox: 600,
    cassette: 500
  },
  grandola: {
    cashbox: 2500,
    recycler: 2800
  },
  aveiro: {
    cashbox: 1500,
    recycler: 60,
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
  },
  gmuk1: {
    cashbox: 2200,
    cassette: 2000
  }
}

const getCashUnitCapacity = (model, device) => {
  if (!cashUnitCapacity[model]) {
    return cashUnitCapacity.default[device]
  }
  return cashUnitCapacity[model][device]
}

export { modelPrettifier, cashUnitCapacity, getCashUnitCapacity }
