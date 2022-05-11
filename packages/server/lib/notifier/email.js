const _ = require('lodash/fp')
const utils = require('./utils')

const email = require('../email')

const {
  PING,
  STALE,
  LOW_CRYPTO_BALANCE,
  HIGH_CRYPTO_BALANCE,
  CASH_BOX_FULL,
  LOW_CASH_OUT,
  SECURITY
} = require('./codes')

function alertSubject (alertRec, config) {
  let alerts = []

  if (config.balance) {
    alerts = _.concat(alerts, alertRec.general)
  }

  _.forEach(device => {
    alerts = _.concat(alerts, utils.deviceAlerts(config, alertRec, device))
  }, _.keys(alertRec.devices))

  if (alerts.length === 0) return null

  const alertTypes = _.flow(_.map('code'), _.uniq, _.map(utils.codeDisplay), _.sortBy(o => o))(alerts)
  return '[Lamassu] Errors reported: ' + alertTypes.join(', ')
}

function printEmailAlerts (alertRec, config) {
  let body = 'Errors were reported by your Lamassu Machines.\n'

  if (config.balance && alertRec.general.length !== 0) {
    body += '\nGeneral errors:\n'
    body += emailAlerts(alertRec.general) + '\n'
  }

  _.forEach(device => {
    const deviceName = alertRec.deviceNames[device]
    body += '\nErrors for ' + deviceName + ':\n'

    const alerts = utils.deviceAlerts(config, alertRec, device)

    body += emailAlerts(alerts)
  }, _.keys(alertRec.devices))
  return body
}

function emailAlerts (alerts) {
  return _.join('\n', _.map(emailAlert, alerts)) + '\n'
}

function emailAlert (alert) {
  switch (alert.code) {
    case PING:
      if (alert.age) {
        const pingAge = utils.formatAge(alert.age, { compact: true, verbose: true })
        return `Machine down for ${pingAge}`
      }
      return 'Machine down for a while.'
    case STALE: {
      const stuckAge = utils.formatAge(alert.age, { compact: true, verbose: true })
      return `Machine is stuck on ${alert.state} screen for ${stuckAge}`
    }
    case LOW_CRYPTO_BALANCE: {
      const balance = utils.formatCurrency(alert.fiatBalance.balance, alert.fiatCode)
      return `Low balance in ${alert.cryptoCode} [${balance}]`
    }
    case HIGH_CRYPTO_BALANCE: {
      const highBalance = utils.formatCurrency(
        alert.fiatBalance.balance,
        alert.fiatCode
      )
      return `High balance in ${alert.cryptoCode} [${highBalance}]`
    }
    case CASH_BOX_FULL:
      return `Cash box full on ${alert.machineName} [${alert.notes} banknotes]`
    case LOW_CASH_OUT:
      return `Cassette for ${alert.denomination} ${alert.fiatCode} low [${alert.notes} banknotes]`
    case SECURITY:
      return `Cashbox removed on ${alert.machineName}`
  }
}

const sendMessage = email.sendMessage

module.exports = { alertSubject, printEmailAlerts, sendMessage }
