const R = require('ramda')

module.exports = {
  unscoped,
  cryptoScoped,
  machineScoped,
  scoped
}

function matchesValue (crypto, machine, instance) {
  return instance.fieldLocator.fieldScope.crypto === crypto &&
  instance.fieldLocator.fieldScope.machine === machine
}

function permutations (crypto, machine) {
  return R.uniq([
    [crypto, machine],
    [crypto, 'global'],
    ['global', machine],
    ['global', 'global']
  ])
}

function fallbackValue (crypto, machine, instances) {
  const notNil = R.pipe(R.isNil, R.not)
  const pickValue = arr => R.find(instance => matchesValue(arr[0], arr[1], instance), instances)
  const fallbackRec = R.find(notNil, R.map(pickValue, permutations(crypto, machine)))
  return fallbackRec && fallbackRec.fieldValue.value
}

function generalScoped (crypto, machine, config) {
  const scopedValue = (key, instances) =>
    [key, fallbackValue(crypto, machine, keyedValues(key, instances))]

  const keyedValues = (key, instances) => R.filter(r => r.fieldLocator.code === key, instances)
  const keys = instances => R.uniq(R.map(r => r.fieldLocator.code, instances))

  const scopedGroups = group => {
    const instances = group.values
    return [group.code, R.fromPairs(keys(instances).map(key => scopedValue(key, instances)))]
  }

  return R.fromPairs(config.groups.map(scopedGroups))
}

function machineScoped (machine, config) {
  return generalScoped('global', machine, config)
}

function unscoped (config) {
  return generalScoped('global', 'global', config)
}

function cryptoScoped (crypto, config) {
  return generalScoped(crypto, 'global', config)
}

function scoped (crypto, machine, config) {
  return generalScoped(crypto, machine, config)
}
