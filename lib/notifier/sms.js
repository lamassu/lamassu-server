const _ = require('lodash/fp')
const utils = require('./utils')
const sms = require('../sms')

function printSmsAlerts (alertRec, config) {
  let alerts = []

  if (config.balance) {
    alerts = _.concat(alerts, alertRec.general)
  }

  _.forEach(device => {
    alerts = _.concat(alerts, utils.deviceAlerts(config, alertRec, device))
  }, _.keys(alertRec.devices))

  if (alerts.length === 0) return null

  const alertsMap = _.groupBy('code', alerts)

  const alertTypes = _.map(entry => {
    const code = entry[0]
    const machineNames = _.filter(
      _.negate(_.isEmpty),
      _.map('machineName', entry[1]),
    )

    const cryptoCodes = _.filter(
      _.negate(_.isEmpty),
      _.map('cryptoCode', entry[1]),
    )

    const cryptoCodes = _.filter(
      _.negate(_.isEmpty),
      _.map('cryptoCode', entry[1])
    )

    return {
      codeDisplay: utils.codeDisplay(code),
      machineNames,
      cryptoCodes
    }
  }, _.toPairs(alertsMap))

  const mapByCodeDisplay = _.map(it => {
    if (_.isEmpty(it.machineNames) && _.isEmpty(it.cryptoCodes)) return it.codeDisplay
    if (_.isEmpty(it.machineNames)) return `${it.codeDisplay} (${it.cryptoCodes.join(', ')})`
    return `${it.codeDisplay} (${it.machineNames.join(', ')})`
  })

  const displayAlertTypes = _.compose(
    _.uniq,
    mapByCodeDisplay,
    _.sortBy('codeDisplay')
  )(alertTypes)

  return '[Lamassu] Errors reported: ' + displayAlertTypes.join(', ')
}

const sendMessage = sms.sendMessage

module.exports = { printSmsAlerts, sendMessage }
