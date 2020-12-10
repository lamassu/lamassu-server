const _ = require('lodash/fp')
const utils = require("./utils")

const email = require('../email')

const {
  PING,
  STALE,
  LOW_CRYPTO_BALANCE,
  HIGH_CRYPTO_BALANCE,
  CASH_BOX_FULL,
  LOW_CASH_OUT
} = require('./codes')

function alertSubject(alertRec, config) {
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

  const alertTypes = _.map(codeDisplay, _.uniq(_.map('code', alerts))).sort()
  return '[Lamassu] Errors reported: ' + alertTypes.join(', ')
}

function printEmailAlerts(alertRec, config) {
  let body = 'Errors were reported by your Lamassu Machines.\n'

  if (config.balance && alertRec.general.length !== 0) {
    body = body + '\nGeneral errors:\n'
    body = body + emailAlerts(alertRec.general) + '\n'
  }

  _.keys(alertRec.devices).forEach(function (device) {
    const deviceName = alertRec.deviceNames[device]
    body = body + '\nErrors for ' + deviceName + ':\n'

    let alerts = []
    if (config.balance) {
      alerts = _.concat(alerts, alertRec.devices[device].balanceAlerts)
    }

    if (config.errors) {
      alerts = _.concat(alerts, alertRec.devices[device].deviceAlerts)
    }

    body = body + emailAlerts(alerts)
  })

  return body
}

function emailAlerts(alerts) {
  return alerts.map(emailAlert).join('\n') + '\n'
}

function emailAlert(alert) {
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
  }
}

const sendMessage = email.sendMessage


module.exports = { alertSubject, printEmailAlerts, sendMessage }
