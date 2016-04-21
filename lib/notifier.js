'use strict'

require('es6-promise').polyfill()

var R = require('ramda')
var db = null
var getBalances = null

function init (_db, _getBalances) {
  db = _db
  getBalances = _getBalances
}

function toInt10 (str) { return parseInt(str, 10) }

function jsonParse (event) {
  return R.assoc('note', JSON.parse(event.note), event)
}

function sameState (a, b) {
  return a.note.sessionId === b.note.sessionId && a.note.state === b.note.state
}

function checkBalance (rec) {
  var LOW_BALANCE_THRESHOLD = 10
  return rec.fiatBalance < LOW_BALANCE_THRESHOLD
  ? {code: 'lowBalance', cryptoCode: rec.cryptoCode, fiatBalance: rec.fiatBalance}
  : null
}

function checkBalances () {
  var balances = getBalances()
  return R.reject(R.isNil, balances.map(checkBalance))
}

function checkPing (deviceEvents) {
  var sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  var lastEvent = R.last(sortedEvents)
  var NETWORK_DOWN_TIME = 2 * 60 * 1000

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
  var STALE_STATE = 60 * 1000

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
  return new Promise(function (resolve, reject) {
    db.devices(function (err, devices) {
      if (err) return reject(err)

      db.machineEvents(function (err, events) {
        if (err) return reject(err)

        return resolve({devices: devices, events: events})
      })
    })
  })
}

function checkStatus () {
  var alerts = {devices: {}}
  alerts.general = checkBalances()

  return devicesAndEvents()
  .then(function (rec) {
    var devices = rec.devices
    var events = rec.events

    devices.rows.forEach(function (deviceRow) {
      var deviceFingerprint = deviceRow.fingerprint
      var deviceEvents = events.rows.filter(function (eventRow) {
        return eventRow.device_fingerprint === deviceFingerprint
      })

      var deviceAlerts = []
      deviceAlerts = R.concat(deviceAlerts, checkStuckScreen(deviceEvents))
      deviceAlerts = R.concat(deviceAlerts, checkPing(deviceEvents))

      alerts.devices[deviceRow.fingerprint] = deviceAlerts
    })

    return alerts
  })
}

var _db = require('./postgresql_interface')
var connectionString = 'postgres://lamassu:lamassu@localhost/lamassu'

var _getBalances = function () {
  return [{cryptoCode: 'BTC', fiatBalance: 12}, {cryptoCode: 'ETH', fiatBalance: 8}]
}

_db.init(connectionString)
init(_db, _getBalances)

checkStatus()
.then(function (alerts) {
  console.log('DEBUG1')
  console.log('%j', alerts)
  process.exit(0)
})
