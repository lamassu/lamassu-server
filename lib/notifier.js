const crypto = require('crypto')
const R = require('ramda')
const prettyMs = require('pretty-ms')
const numeral = require('numeral')

const configManager = require('./config-manager')
const settingsLoader = require('./settingsLoader')
const db = require('./postgresql_interface')

const STALE_STATE = 2 * 60 * 1000
const NETWORK_DOWN_TIME = 60 * 1000

let getBalances

function init (_getBalances) {
  getBalances = _getBalances
}

function toInt10 (str) { return parseInt(str, 10) }

function jsonParse (event) {
  return R.assoc('note', JSON.parse(event.note), event)
}

function sameState (a, b) {
  return a.note.txId === b.note.txId && a.note.state === b.note.state
}

function checkBalance (rec) {
  const settings = settingsLoader.settings
  const config = configManager.unscoped(settings.config)
  const lowBalanceThreshold = config.notifications.lowBalanceThreshold
  return lowBalanceThreshold && rec.fiatBalance < lowBalanceThreshold
  ? {code: 'lowBalance', cryptoCode: rec.cryptoCode, fiatBalance: rec.fiatBalance, fiatCode: rec.fiatCode}
  : null
}

function checkBalances () {
  return getBalances()
  .then(balances => R.reject(R.isNil, balances.map(checkBalance)))
}

function checkPing (deviceEvents) {
  const sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  const lastEvent = R.last(sortedEvents)

  if (!lastEvent) {
    return [{code: 'ping'}]
  }

  const age = Math.floor(lastEvent.age)
  if (age > NETWORK_DOWN_TIME) {
    return [{code: 'ping', age: age}]
  }

  return []
}

function checkStuckScreen (deviceEvents) {
  const sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  const noRepeatEvents = R.dropRepeatsWith(sameState, sortedEvents)
  const lastEvent = R.last(noRepeatEvents)

  if (!lastEvent) {
    return []
  }

  const state = lastEvent.note.state
  const isIdle = lastEvent.note.isIdle

  if (isIdle) {
    return []
  }

  const age = Math.floor(lastEvent.age)
  if (age > STALE_STATE) {
    return [{code: 'stale', state: state, age: age}]
  }

  return []
}

function devicesAndEvents () {
  return Promise.all([db.devices(), db.machineEvents()])
  .then(arr => ({devices: arr[0], events: arr[1]}))
}

function checkStatus () {
  const alerts = {devices: {}, deviceNames: {}}

  return Promise.all([checkBalances(), devicesAndEvents()])
  .then(([balances, rec]) => {
    const devices = rec.devices
    const events = rec.events

    alerts.general = balances
    devices.forEach(function (deviceRow) {
      const deviceId = deviceRow.device_id
      const deviceName = deviceRow.name || deviceId
      const deviceEvents = events.filter(function (eventRow) {
        return eventRow.device_id === deviceId
      })

      const deviceAlerts = checkStuckScreen(deviceEvents).concat(checkPing(deviceEvents))

      alerts.devices[deviceId] = deviceAlerts
      alerts.deviceNames[deviceId] = deviceName
    })

    return alerts
  })
}

function formatCurrency (num, code) {
  return numeral(num).format('0,0.00') + ' ' + code
}

function emailAlert (alert) {
  switch (alert.code) {
    case 'ping':
      if (alert.age) {
        const pingAge = prettyMs(alert.age, {compact: true, verbose: true})
        return 'Connection to machine down for ' + pingAge
      }
      return 'Machine down for a while or never connected'
    case 'stale':
      const stuckAge = prettyMs(alert.age, {compact: true, verbose: true})
      return 'Machine is stuck on ' + alert.state + 'screen for ' + stuckAge
    case 'lowBalance':
      const balance = formatCurrency(alert.fiatBalance, alert.fiatCode)
      return 'Low balance of ' + balance + ' in ' + alert.cryptoCode + ' wallet'
  }
}

function emailAlerts (alerts) {
  return alerts.map(emailAlert).join('\n') + '\n'
}

function printEmailAlerts (alertRec) {
  let body = 'Errors were reported by your Lamassu Machines.\n'

  if (alertRec.general.length !== 0) {
    body = body + '\nGeneral errors:\n'
    body = body + emailAlerts(alertRec.general)
  }

  R.keys(alertRec.devices).forEach(function (device) {
    const deviceName = alertRec.deviceNames[device]
    body = body + '\nErrors for ' + deviceName + ':\n'
    body = body + emailAlerts(alertRec.devices[device])
  })

  return body
}

function alertSubject (alertRec) {
  let alerts = alertRec.general
  R.keys(alertRec.devices).forEach(function (device) {
    alerts = R.concat(alerts, alertRec.devices[device])
  })
  if (alerts.length === 0) return null
  const alertTypes = R.uniq(R.pluck('code', alerts)).sort()
  return '[Lamassu] Errors reported: ' + alertTypes.join(', ')
}

function alertFingerprint (alertRec) {
  const subject = alertSubject(alertRec)
  if (!subject) return null
  return crypto.createHash('sha256').update(subject).digest('hex')
}

module.exports = {
  init,
  checkStatus,
  printEmailAlerts,
  alertFingerprint,
  alertSubject
}
