const crypto = require('crypto')
const _ = require('lodash/fp')
const prettyMs = require('pretty-ms')
const numeral = require('numeral')

const dbm = require('./postgresql_interface')
const db = require('./db')
const T = require('./time')
const logger = require('./logger')

const STALE_STATE = 7 * T.minute
const NETWORK_DOWN_TIME = 1 * T.minute
const ALERT_SEND_INTERVAL = T.hour

const PING = 'PING'
const STALE = 'STALE'
const LOW_CRYPTO_BALANCE = 'LOW_CRYPTO_BALANCE'
const CASH_BOX_FULL = 'CASH_BOX_FULL'
const LOW_CASH_OUT = 'LOW_CASH_OUT'

const CODES_DISPLAY = {
  PING: 'Machine Down',
  STALE: 'Machine Stuck',
  LOW_CRYPTO_BALANCE: 'Low Crypto Balance',
  CASH_BOX_FULL: 'Cash box full',
  LOW_CASH_OUT: 'Low Cash-out'
}

let alertFingerprint
let lastAlertTime

function codeDisplay (code) {
  return CODES_DISPLAY[code]
}

function jsonParse (event) {
  return _.set('note', JSON.parse(event.note), event)
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
  if (!plugins.notificationsEnabled()) return Promise.resolve()

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

const getDeviceTime = _.flow(_.get('device_time'), Date.parse)

function dropRepeatsWith (comparator, arr) {
  const iteratee = (acc, val) => val === acc.last
    ? acc
    : { arr: _.concat(acc.arr, val), last: val }

  return _.reduce(iteratee, { arr: [] }, arr).arr
}

function checkStuckScreen (deviceEvents) {
  const sortedEvents = _.sortBy(getDeviceTime, _.map(jsonParse, deviceEvents))
  const noRepeatEvents = dropRepeatsWith(sameState, sortedEvents)
  const lastEvent = _.last(noRepeatEvents)

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
    return [{ code: STALE, state, age }]
  }

  return []
}

function checkPing (deviceId) {
  const sql = `select (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age from machine_pings
    where device_id=$1
    order by created desc
    limit 1`

  return db.oneOrNone(sql, [deviceId])
    .then(row => {
      if (!row) return [{ code: PING }]
      if (row.age > NETWORK_DOWN_TIME) return [{ code: PING, age: row.age }]
      return []
    })
}

function checkPings (devices) {
  const deviceIds = _.map('deviceId', devices)
  const promises = _.map(checkPing, deviceIds)

  return Promise.all(promises)
    .then(_.zipObject(deviceIds))
}

function checkStatus (plugins) {
  const alerts = { devices: {}, deviceNames: {} }

  return Promise.all([plugins.checkBalances(), dbm.machineEvents(), plugins.getMachineNames()])
    .then(([balances, events, devices]) => {
      return checkPings(devices)
        .then(pings => {
          alerts.general = _.filter(r => !r.deviceId, balances)
          devices.forEach(function (device) {
            const deviceId = device.deviceId
            const deviceName = device.name
            const deviceEvents = events.filter(function (eventRow) {
              return eventRow.device_id === deviceId
            })

            const balanceAlerts = _.filter(['deviceId', deviceId], balances)
            const ping = pings[deviceId] || []
            const stuckScreen = checkStuckScreen(deviceEvents)

            const deviceAlerts = _.isEmpty(ping) ? stuckScreen : ping

            alerts.devices[deviceId] = _.concat(deviceAlerts, balanceAlerts)
            alerts.deviceNames[deviceId] = deviceName
          })

          return alerts
        })
    })
}

function formatCurrency (num, code) {
  return numeral(num).format('0,0.00') + ' ' + code
}

function emailAlert (alert) {
  switch (alert.code) {
    case PING:
      if (alert.age) {
        const pingAge = prettyMs(alert.age, { compact: true, verbose: true })
        return `Machine down for ${pingAge}`
      }
      return 'Machine down for a while.'
    case STALE:
      const stuckAge = prettyMs(alert.age, { compact: true, verbose: true })
      return `Machine is stuck on ${alert.state} screen for ${stuckAge}`
    case LOW_CRYPTO_BALANCE:
      const balance = formatCurrency(alert.fiatBalance.balance, alert.fiatCode)
      return `Low balance in ${alert.cryptoCode} [${balance}]`
    case CASH_BOX_FULL:
      return `Cash box full on ${alert.machineName} [${alert.notes} banknotes]`
    case LOW_CASH_OUT:
      return `Cassette for ${alert.denomination} ${alert.fiatCode} low [${alert.notes} banknotes]`
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

  _.keys(alertRec.devices).forEach(function (device) {
    const deviceName = alertRec.deviceNames[device]
    body = body + '\nErrors for ' + deviceName + ':\n'
    body = body + emailAlerts(alertRec.devices[device])
  })

  return body
}

function alertSubject (alertRec) {
  let alerts = alertRec.general

  _.keys(alertRec.devices).forEach(function (device) {
    alerts = _.concat(alerts, alertRec.devices[device])
  })

  if (alerts.length === 0) return null

  const alertTypes = _.map(codeDisplay, _.uniq(_.map('code', alerts))).sort()
  return '[Lamassu] Errors reported: ' + alertTypes.join(', ')
}

function buildAlertFingerprint (alertRec) {
  const subject = alertSubject(alertRec)
  if (!subject) return null
  return crypto.createHash('sha256').update(subject).digest('hex')
}

module.exports = { checkNotification }
