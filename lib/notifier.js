const crypto = require('crypto')
const R = require('ramda')
const prettyMs = require('pretty-ms')
const numeral = require('numeral')

const db = require('./postgresql_interface')
const T = require('./time')
const logger = require('./logger')

const STALE_STATE = 2 * T.minute
const NETWORK_DOWN_TIME = T.minute
const ALERT_SEND_INTERVAL = T.hour

let alertFingerprint
let lastAlertTime

function toInt10 (str) { return parseInt(str, 10) }

function jsonParse (event) {
  return R.assoc('note', JSON.parse(event.note), event)
}

function sameState (a, b) {
  return a.note.txId === b.note.txId && a.note.state === b.note.state
}

function sendNoAlerts (plugins) {
  const subject = '[Lamassu] All clear'
  const rec = {
    sms: {
      body: subject
    },
    email: {
      subject,
      body: 'No errors are reported for your machines.'
    }
  }

  return plugins.sendMessage(rec)
}

function checkNotification (plugins) {
  return checkStatus(plugins)
  .then(alertRec => {
    const currentAlertFingerprint = buildAlertFingerprint(alertRec)
    if (!currentAlertFingerprint) {
      const inAlert = !!alertFingerprint
      alertFingerprint = null
      lastAlertTime = null
      if (inAlert) return sendNoAlerts(plugins)
    }

    const alertChanged = currentAlertFingerprint === alertFingerprint &&
      lastAlertTime - Date.now() < ALERT_SEND_INTERVAL
    if (alertChanged) return

    const subject = alertSubject(alertRec)
    const rec = {
      sms: {
        body: subject
      },
      email: {
        subject,
        body: printEmailAlerts(alertRec)
      }
    }
    alertFingerprint = currentAlertFingerprint
    lastAlertTime = Date.now()

    return plugins.sendMessage(rec)
  })
  .then(results => {
    if (results && results.length > 0) logger.debug('Successfully sent alerts')
  })
  .catch(logger.error)
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

function checkStatus (plugins) {
  const alerts = {devices: {}, deviceNames: {}}

  return Promise.all([plugins.checkBalances(), devicesAndEvents()])
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

function buildAlertFingerprint (alertRec) {
  const subject = alertSubject(alertRec)
  if (!subject) return null
  return crypto.createHash('sha256').update(subject).digest('hex')
}

module.exports = {checkNotification}
