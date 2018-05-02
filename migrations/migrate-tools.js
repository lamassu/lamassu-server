const pgp = require('pg-promise')()
const _ = require('lodash/fp')

const settingsLoader = require('../lib/settings-loader')
const machineLoader = require('../lib/machine-loader')

module.exports = {migrateNames}

function migrateNames () {
  const cs = new pgp.helpers.ColumnSet(['?device_id', 'name'], {table: 'devices'})

  return settingsLoader.loadLatest()
    .then(r => machineLoader.getMachineNames(r.config))
    .then(_.map(r => ({device_id: r.deviceId, name: r.name})))
    .then(data => pgp.helpers.update(data, cs) + ' WHERE t.device_id=v.device_id')
}
