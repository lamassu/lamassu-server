var pgp = require('pg-promise')()
var psqlUrl = require('../lib/options').postgres
var R = require('ramda')

function connect () {
  return pgp(psqlUrl)
}
exports.connect = connect

function load () {
  var db = connect()
  return db.one('select data from user_config where type=$1', 'exchanges')
  .then(function (data) {
    pgp.end()
    return data.data
  })
}

module.exports = {
  load,
  unscoped,
  cryptoScoped,
  machineScoped,
  scoped
}

function matchesValue (crypto, machine, instance) {
  instance.fieldScope.crypto === crypto &&
  instance.fieldScope.machine === machine
}

function permutations (crypto, machine) {
  return R.uniq([
    [crypto, machine],
    [crypto, 'global'],
    ['global', machine],
    ['global', 'global']
  ])
}

function fallbackValue (arr, instances) {
  const crypto = arr[0]
  const machine = arr[1]
  const notNil = R.pipe(R.isNil, R.not)
  const pickValue = (crypto, machine) => R.find(matchesValue, instances)

  return R.find(notNil, R.map(pickValue, permutations(crypto, machine)))
}

function generalScoped (crypto, machine, config) {
  const machineScopedCluster = fieldCluster =>
    [fieldCluster.code, fallbackValue(crypto, machine, fieldCluster.fieldInstances)]

  const scopedGroups = group =>
    [group.code, R.fromPairs(group.fieldClusters.map(machineScopedCluster))]

  return R.fromPairs(config.groups.map(scopedGroups))
}

function machineScoped (machine, config) {
  generalScoped('global', machine, config)
}

function unscoped (config) {
  generalScoped('global', 'global', config)
}

function cryptoScoped (crypto, config) {
  generalScoped(crypto, 'global', config)
}

function scoped (crypto, machine, config) {
  generalScoped(crypto, machine, config)
}
