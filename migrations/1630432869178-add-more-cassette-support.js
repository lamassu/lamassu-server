var db = require('./db')
const _ = require('lodash/fp')
const { migrationSaveConfig, loadLatest } = require('../lib/new-settings-loader')
const { getMachineIds } = require('../lib/machine-loader')

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

  return Promise.all([loadLatest(), getMachineIds()])
    .then(([config, machineIds]) => {
      const newConfig = _.reduce((acc, value) => {
        const deviceId = value.device_id
        if (_.includes(`cashOut_${deviceId}_top`, _.keys(config.config))) {
          acc[`cashOut_${deviceId}_cassette1`] = config.config[`cashOut_${deviceId}_top`]
        }

        if (_.includes(`cashOut_${deviceId}_bottom`, _.keys(config.config))) {
          acc[`cashOut_${deviceId}_cassette2`] = config.config[`cashOut_${deviceId}_bottom`]
        }

        return acc
      }, {}, machineIds)

      return migrationSaveConfig(newConfig)
        .then(() => db.multi(sql, next))
    })
}

exports.down = function (next) {
  next()
}
