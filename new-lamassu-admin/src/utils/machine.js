const modelPrettifier = {
  douro1: 'Douro',
  sintra: 'Sintra',
  gaia: 'Gaia',
  tejo: 'Tejo',
  aveiro: 'Aveiro',
  grandola: 'Grândola'
}

const hasRecycler = machine =>
  machine.model === 'aveiro' || machine.model === 'grandola'

const cashUnitCapacity = {
  tejo: {
    cashbox: 1000,
    cassette: 500
  },
  aveiro: {
    cashbox: 500,
    cassette: 200,
    stacker: 60
  }
}

export { modelPrettifier, cashUnitCapacity, hasRecycler }
