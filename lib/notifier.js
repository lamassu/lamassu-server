var crypto = require('crypto')
var R = require('ramda')
var prettyMs = require('pretty-ms')
var numeral = require('numeral')
var db = null
var getBalances = null

var LOW_BALANCE_THRESHOLD = null
var STALE_STATE = 2 * 60 * 1000
var NETWORK_DOWN_TIME = 60 * 1000

function init (_db, _getBalances, config) {
  db = _db
  getBalances = _getBalances

  if (config && config.lowBalanceThreshold) {
    LOW_BALANCE_THRESHOLD = config.lowBalanceThreshold
  }
}
exports.init = init

function toInt10 (str) { return parseInt(str, 10) }

function jsonParse (event) {
  return R.assoc('note', JSON.parse(event.note), event)
}

function sameState (a, b) {
  return a.note.txId === b.note.txId && a.note.state === b.note.state
}

function checkBalance (rec) {
  return LOW_BALANCE_THRESHOLD && rec.fiatBalance < LOW_BALANCE_THRESHOLD
  ? {code: 'lowBalance', cryptoCode: rec.cryptoCode, fiatBalance: rec.fiatBalance, fiatCode: rec.fiatCode}
  : null
}

function checkBalances () {
  var balances = getBalances()
  return R.reject(R.isNil, balances.map(checkBalance))
}

function checkPing (deviceEvents) {
  var sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  var lastEvent = R.last(sortedEvents)

  if (!lastEvent) {
    return [{code: 'ping'}]
  }

  var age = Math.floor(lastEvent.age)
  if (age > NETWORK_DOWN_TIME) {
    return [{code: 'ping', age: age}]
  }

  return []
}

function checkStuckScreen (deviceEvents) {
  var sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  var noRepeatEvents = R.dropRepeatsWith(sameState, sortedEvents)
  var lastEvent = R.last(noRepeatEvents)

  if (!lastEvent) {
    return []
  }

  var state = lastEvent.note.state
  var isIdle = lastEvent.note.isIdle

  if (isIdle) {
    return []
  }

  var age = Math.floor(lastEvent.age)
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
  var alerts = {devices: {}, deviceNames: {}}
  alerts.general = checkBalances()

  return devicesAndEvents()
  .then(function (rec) {
    var devices = rec.devices
    var events = rec.events

    devices.forEach(function (deviceRow) {
      var deviceId = deviceRow.device_id
      var deviceName = deviceRow.name || deviceId
      var deviceEvents = events.filter(function (eventRow) {
        return eventRow.device_id === deviceId
      })

      var deviceAlerts = []
      deviceAlerts = R.concat(deviceAlerts, checkStuckScreen(deviceEvents))
      deviceAlerts = R.concat(deviceAlerts, checkPing(deviceEvents))

      alerts.devices[deviceId] = deviceAlerts
      alerts.deviceNames[deviceId] = deviceName
    })

    return alerts
  })
}
exports.checkStatus = checkStatus

function formatCurrency (num, code) {
  return numeral(num).format('0,0.00') + ' ' + code
}

function emailAlert (alert) {
  switch (alert.code) {
    case 'ping':
      if (alert.age) {
        var pingAge = prettyMs(alert.age, {compact: true, verbose: true})
        return 'Connection to machine down for ' + pingAge
      }
      return 'Machine down for a while or never connected'
    case 'stale':
      var stuckAge = prettyMs(alert.age, {compact: true, verbose: true})
      return 'Machine is stuck on ' + alert.state + 'screen for ' + stuckAge
    case 'lowBalance':
      var balance = formatCurrency(alert.fiatBalance, alert.fiatCode)
      return 'Low balance of ' + balance + ' in ' + alert.cryptoCode + ' wallet'
  }
}

function emailAlerts (alerts) {
  return alerts.map(emailAlert).join('\n') + '\n'
}

function printEmailAlerts (alertRec) {
  var body = 'Errors were reported by your Lamassu Machines.\n'

  if (alertRec.general.length !== 0) {
    body = body + '\nGeneral errors:\n'
    body = body + emailAlerts(alertRec.general)
  }

  R.keys(alertRec.devices).forEach(function (device) {
    var deviceName = alertRec.deviceNames[device]
    body = body + '\nErrors for ' + deviceName + ':\n'
    body = body + emailAlerts(alertRec.devices[device])
  })

  return body
}
exports.printEmailAlerts = printEmailAlerts

function alertSubject (alertRec) {
  var alerts = alertRec.general
  R.keys(alertRec.devices).forEach(function (device) {
    alerts = R.concat(alerts, alertRec.devices[device])
  })
  if (alerts.length === 0) return null
  var alertTypes = R.uniq(R.pluck('code', alerts)).sort()
  return '[Lamassu] Errors reported: ' + alertTypes.join(', ')
}
exports.alertSubject = alertSubject

function alertFingerprint (alertRec) {
  var subject = alertSubject(alertRec)
  if (!subject) return null
  return crypto.createHash('sha256').update(subject).digest('hex')
}
exports.alertFingerprint = alertFingerprint
