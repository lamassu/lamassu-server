const _ = require('lodash/fp')

module.exports = {
  unscoped,
  cryptoScoped,
  machineScoped,
  scoped,
  scopedValue,
  all
}

function matchesValue (crypto, machine, instance) {
  return instance.fieldLocator.fieldScope.crypto === crypto &&
  instance.fieldLocator.fieldScope.machine === machine
}

function permutations (crypto, machine) {
  return _.uniq([
    [crypto, machine],
    [crypto, 'global'],
    ['global', machine],
    ['global', 'global']
  ])
}

function fallbackValue (crypto, machine, instances) {
  const notNil = _.negate(_.isNil)
  const pickValue = arr => _.find(instance => matchesValue(arr[0], arr[1], instance), instances)
  const fallbackRec = _.find(notNil, _.map(pickValue, permutations(crypto, machine)))
  return fallbackRec && fallbackRec.fieldValue.value
}

function scopedValue (crypto, machine, fieldCode, config) {
  const allScopes = config.filter(_.pathEq(['fieldLocator', 'code'], fieldCode))

  return fallbackValue(crypto, machine, allScopes)
}

function generalScoped (crypto, machine, config) {
  const localScopedValue = key =>
    scopedValue(crypto, machine, key, config)

  const keys = _.uniq(_.map(r => r.fieldLocator.code, config))
  const keyedValues = keys.map(localScopedValue)

  return _.zipObject(keys, keyedValues)
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

function all (code, config) {
  return _.uniq(_.map('fieldValue.value', _.filter(i => i.fieldLocator.code === code, config)))
}
