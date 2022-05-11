var db = require('./db')
const _ = require('lodash/fp')
const { migrationSaveConfig, loadLatest } = require('../lib/new-settings-loader')
const { getMachines } = require('../lib/machine-loader')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cash_out_actions 
      ADD COLUMN provisioned_3 INTEGER,
      ADD COLUMN provisioned_4 INTEGER,
      ADD COLUMN dispensed_3 INTEGER,
      ADD COLUMN dispensed_4 INTEGER,
      ADD COLUMN rejected_3 INTEGER,
      ADD COLUMN rejected_4 INTEGER,
      ADD COLUMN denomination_3 INTEGER,
      ADD COLUMN denomination_4 INTEGER`,
    `ALTER TABLE devices 
      ADD COLUMN cassette3 INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN cassette4 INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN number_of_cassettes INTEGER NOT NULL DEFAULT 2`,
    `ALTER TABLE cash_out_txs 
      ADD COLUMN provisioned_3 INTEGER,
      ADD COLUMN provisioned_4 INTEGER,
      ADD COLUMN denomination_3 INTEGER,
      ADD COLUMN denomination_4 INTEGER`
  ]

  return Promise.all([loadLatest(), getMachines()])
    .then(([config, machines]) => {
      const formattedMachines = _.map(it => _.pick(['deviceId'], it), machines)
      const newConfig = _.reduce((acc, value) => {
        if (_.includes(`cashOut_${value.deviceId}_top`, _.keys(config.config))) {
          acc[`cashOut_${value.deviceId}_cassette1`] = config.config[`cashOut_${value.deviceId}_top`]
        }

        if (_.includes(`cashOut_${value.deviceId}_bottom`, _.keys(config.config))) {
          acc[`cashOut_${value.deviceId}_cassette2`] = config.config[`cashOut_${value.deviceId}_bottom`]
        }

        return acc
      }, {}, formattedMachines)

      return migrationSaveConfig(newConfig)
        .then(() => db.multi(sql, next))
    })
}

exports.down = function (next) {
  next()
}
