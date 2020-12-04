const _ = require('lodash/fp')
const utils = require('./utils')
const sms = require('../sms')

function printSmsAlerts(alertRec, config) {
  let alerts = []

  if (config.balance) {
    alerts = _.concat(alerts, alertRec.general)
  }

  _.keys(alertRec.devices).forEach(function (device) {
    if (config.balance) {
      alerts = _.concat(alerts, alertRec.devices[device].balanceAlerts)
    }

    if (config.errors) {
      alerts = _.concat(alerts, alertRec.devices[device].deviceAlerts)
    }
  })

  if (alerts.length === 0) return null

  const alertsMap = _.groupBy('code', alerts)

  const alertTypes = _.map(entry => {
    const code = entry[0]
    const machineNames = _.filter(
      _.negate(_.isEmpty),
      _.map('machineName', entry[1])
    )

    return {
      codeDisplay: utils.codeDisplay(code),
      machineNames
    }
  }, _.toPairs(alertsMap))

  const mapByCodeDisplay = _.map(it =>
    _.isEmpty(it.machineNames)
      ? it.codeDisplay
      : `${it.codeDisplay} (${it.machineNames.join(', ')})`
  )

  const displayAlertTypes = _.compose(
    _.uniq,
    mapByCodeDisplay,
    _.sortBy('codeDisplay')
  )(alertTypes)

  return '[Lamassu] Errors reported: ' + displayAlertTypes.join(', ')
}

const sendMessage = sms.sendMessage

module.exports = { printSmsAlerts, sendMessage }
