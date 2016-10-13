var pgp = require('pg-promise')()
var psqlUrl = require('../lib/options').postgresql
var R = require('ramda')

function connect () {
  console.log(psqlUrl)
  return pgp(psqlUrl)
}

function load () {
  var db = connect()
  return db.one('select data from user_config where type=$1', 'config')
  .then(function (data) {
    pgp.end()
    return data.data
  })
}

function loadAccounts () {
  const toFields = fieldArr => R.fromPairs(R.map(r => [r.code, r.value], fieldArr))
  const toPairs = r => [r.code, toFields(r.fields)]
  var db = connect()
  return db.one('select data from user_config where type=$1', 'accounts')
  .then(function (data) {
    pgp.end()
    return R.fromPairs(R.map(toPairs, data.data.accounts))
  })
}

module.exports = {
  load,
  unscoped,
  cryptoScoped,
  machineScoped,
  scoped,
  loadAccounts
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
  console.log('DEBUG10: %j', instances)
  const pickValue = arr => R.find(instance => matchesValue(arr[0], arr[1], instance), instances)
  console.log('DEBUG11: %j', permutations(crypto, machine))
  console.log('DEBUG14: %j', R.map(pickValue, permutations(crypto, machine)))
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
    console.log('DEBUG66: %j', keys(instances))
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
