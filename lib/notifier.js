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
const HIGH_CRYPTO_BALANCE = 'HIGH_CRYPTO_BALANCE'
const CASH_BOX_FULL = 'CASH_BOX_FULL'
const LOW_CASH_OUT = 'LOW_CASH_OUT'

const CODES_DISPLAY = {
  PING: 'Machine Down',
  STALE: 'Machine Stuck',
  LOW_CRYPTO_BALANCE: 'Low Crypto Balance',
  HIGH_CRYPTO_BALANCE: 'High Crypto Balance',
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

function sendNoAlerts (plugins, smsEnabled, emailEnabled) {
  const subject = '[Lamassu] All clear'

  let rec = {}
  if (smsEnabled) {
    rec = _.set(['sms', 'body'])(subject)(rec)
  }

  if (emailEnabled) {
    rec = _.set(['email', 'subject'])(subject)(rec)
    rec = _.set(['email', 'body'])('No errors are reported for your machines.')(rec)
  }

  return plugins.sendMessage(rec)
}

function checkNotification (plugins) {
  const notifications = plugins.getNotificationConfig()
  const isActive = it => it.active && (it.balance || it.errors)
  const smsEnabled = isActive(notifications.sms)
  const emailEnabled = isActive(notifications.email)

  if (!smsEnabled && !emailEnabled) return Promise.resolve()

  return checkStatus(plugins)
    .then(alertRec => {
      const currentAlertFingerprint = buildAlertFingerprint(alertRec, notifications)
      if (!currentAlertFingerprint) {
        const inAlert = !!alertFingerprint
        alertFingerprint = null
        lastAlertTime = null
        if (inAlert) return sendNoAlerts(plugins, smsEnabled, emailEnabled)
      }

      const alertChanged = currentAlertFingerprint === alertFingerprint &&
      lastAlertTime - Date.now() < ALERT_SEND_INTERVAL
      if (alertChanged) return

      let rec = {}
      if (smsEnabled) {
        rec = _.set(['sms', 'body'])(printSmsAlerts(alertRec, notifications.sms))(rec)
      }

      if (emailEnabled) {
        rec = _.set(['email', 'subject'])(alertSubject(alertRec, notifications.email))(rec)
        rec = _.set(['email', 'body'])(printEmailAlerts(alertRec, notifications.email))(rec)
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

function checkStuckScreen (deviceEvents, machineName) {
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
    return [{ code: STALE, state, age, machineName }]
  }

  return []
}

function checkPing (device) {
  const sql = `select (EXTRACT(EPOCH FROM (now() - updated))) * 1000 AS age from machine_pings
    where device_id=$1`
  const deviceId = device.deviceId
  return db.oneOrNone(sql, [deviceId])
    .then(row => {
      if (!row) return [{ code: PING }]
      if (row.age > NETWORK_DOWN_TIME) return [{ code: PING, age: row.age, machineName: device.name }]
      return []
    })
}

function checkPings (devices) {
  const deviceIds = _.map('deviceId', devices)
  const promises = _.map(checkPing, devices)

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

            const ping = pings[deviceId] || []
            const stuckScreen = checkStuckScreen(deviceEvents, deviceName)

            if (!alerts.devices[deviceId]) alerts.devices[deviceId] = {}
            alerts.devices[deviceId].balanceAlerts = _.filter(['deviceId', deviceId], balances)
            alerts.devices[deviceId].deviceAlerts = _.isEmpty(ping) ? stuckScreen : ping

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
    case HIGH_CRYPTO_BALANCE:
      const highBalance = formatCurrency(alert.fiatBalance.balance, alert.fiatCode)
      return `High balance in ${alert.cryptoCode} [${highBalance}]`
    case CASH_BOX_FULL:
      return `Cash box full on ${alert.machineName} [${alert.notes} banknotes]`
    case LOW_CASH_OUT:
      return `Cassette for ${alert.denomination} ${alert.fiatCode} low [${alert.notes} banknotes]`
  }
}

function emailAlerts (alerts) {
  return alerts.map(emailAlert).join('\n') + '\n'
}

function printEmailAlerts (alertRec, config) {
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

function alertSubject (alertRec, config) {
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

function printSmsAlerts (alertRec, config) {
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
    const machineNames = _.filter(_.negate(_.isEmpty), _.map('machineName', entry[1]))

    return {
      codeDisplay: codeDisplay(code),
      machineNames
    }
  }, _.toPairs(alertsMap))

  const mapByCodeDisplay = _.map(it => _.isEmpty(it.machineNames)
    ? it.codeDisplay : `${it.codeDisplay} (${it.machineNames.join(', ')})`
  )

  const displayAlertTypes = _.compose(_.uniq, mapByCodeDisplay, _.sortBy('codeDisplay'))(alertTypes)

  return '[Lamassu] Errors reported: ' + displayAlertTypes.join(', ')
}

function getAlertTypes (alertRec, config) {
  let alerts = []

  if (!config.active || (!config.balance && !config.errors)) return alerts

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

  return alerts
}

function buildAlertFingerprint (alertRec, notifications) {
  const sms = getAlertTypes(alertRec, notifications.sms)
  const email = getAlertTypes(alertRec, notifications.email)

  if (sms.length === 0 && email.length === 0) return null

  const smsTypes = _.map(codeDisplay, _.uniq(_.map('code', sms))).sort()
  const emailTypes = _.map(codeDisplay, _.uniq(_.map('code', email))).sort()

  const subject = _.concat(smsTypes, emailTypes).join(', ')

  return crypto.createHash('sha256').update(subject).digest('hex')
}

module.exports = {
  checkNotification,
  checkPings,
  checkStuckScreen
}
