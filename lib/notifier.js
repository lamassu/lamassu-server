'use strict'

var R = require('ramda')

var db = null
var getBalance = null

function init (_db, _getBalance) {
  db = _db
  getBalance = _getBalance
}

function toInt10 (str) { return parseInt(str, 10) }

function jsonParse (event) {
  return R.assoc('note', JSON.parse(event.note), event)
}

function sameState (a, b) {
  return a.note.sessionId === b.note.sessionId && a.note.state === b.note.state
}

function checkBalance () {
  var LOW_BALANCE_THRESHOLD = 10
  if (getBalance() < LOW_BALANCE_THRESHOLD) {
    return console.log('Bitcoin balance is low [ALERT]')
  }

  console.log('Bitcoin balance ok [OK]')
}

function checkPing (deviceEvents) {
  var sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  var lastEvent = R.last(sortedEvents)
  var NETWORK_DOWN_TIME = 2 * 60 * 1000

  if (!lastEvent) {
    console.log('No data for device')
    return
  }

  if (lastEvent.age > NETWORK_DOWN_TIME) {
    return console.log('Device not reachable [ALERT]')
  }

  console.log('Device reachable [OK]')
}

function checkStuckScreen (deviceEvents) {
  var sortedEvents = R.sortBy(R.compose(toInt10, R.prop('device_time')), R.map(jsonParse, deviceEvents))
  var noRepeatEvents = R.dropRepeatsWith(sameState, sortedEvents)
  var lastEvent = R.last(noRepeatEvents)
  var IDLE_STATES = ['idle', 'dualIdle']
  var STALE_STATE = 60 * 1000

  if (!lastEvent) {
    console.log('No data for device')
    return
  }

  var state = lastEvent.note.state
  if (R.contains(state, IDLE_STATES)) {
    console.log('Machine is idle [OK]')
    return
  }

  console.log(lastEvent.age)
  if (lastEvent.age > STALE_STATE) {
    console.log('Stale state: ' + state + ' [ALERT]')
    return
  }

  console.log('[OK]')
}

function checkStatus () {
/*
  - Fetch devices from devices table
  - Fetch all machine_events into memory
  - For each device, verify the following:
    v stuck on screen
      - last screen is >5m stale and is not idle screen
      - report stuck on screen and name of screen
    - not scanning qr codes?
    - low bitcoins -- need a separate strategy, but server has this info
      - var fiatBalance = plugins.fiatBalance();
    v machine isn't pinging server
    - jam checking, need report from l-m
*/
  checkBalance()

  db.devices(function (err, devices) {
    if (err) return console.error(err)

    db.machineEvents(function (err, events) {
      if (err) return console.error(err)

      devices.rows.forEach(function (deviceRow) {
        var deviceFingerprint = deviceRow.fingerprint
        var deviceEvents = events.rows.filter(function (eventRow) {
          return eventRow.device_fingerprint === deviceFingerprint
        })

        console.log('DEVICE: ' + deviceRow.fingerprint)
        checkStuckScreen(deviceEvents)
        checkPing(deviceEvents)
      })
    })
  })
}

var _db = require('./postgresql_interface')
var connectionString = 'postgres://lamassu:lamassu@localhost/lamassu'

var _getBalance = function () {
  return 12
}

_db.init(connectionString)
init(_db, _getBalance)

checkStatus()

// TODO: How to know which alerts have been sent?
// Send alert every 10m while alert state
// Remember last sent alert in memory
