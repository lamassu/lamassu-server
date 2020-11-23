const _ = require('lodash/fp')
const crypto = require('crypto')
const {
  CODES_DISPLAY,
  NETWORK_DOWN_TIME,
  PING,
  ALERT_SEND_INTERVAL
} = require('./codes')

function parseEventNote(event) {
  return _.set('note', JSON.parse(event.note), event)
}

function checkPing(device) {
  const age = +Date.now() - +new Date(device.lastPing)
  if (age > NETWORK_DOWN_TIME)
    return [{ code: PING, age, machineName: device.name }]
  return []
}

const getDeviceTime = _.flow(_.get('device_time'), Date.parse)

const isActive = it => it.active && (it.balance || it.errors)

const codeDisplay = code => CODES_DISPLAY[code]

const alertFingerprint = {
  fingerprint: null,
  lastAlertTime: null
}

const getAlertFingerprint = () => alertFingerprint.fingerprint

const getLastAlertTime = () => alertFingerprint.lastAlertTime

const setAlertFingerprint = (fp, time = Date.now()) => {
  alertFingerprint.fingerprint = fp
  alertFingerprint.lastAlertTime = time
}

const shouldNotAlert = currentAlertFingerprint => {
  return (
    currentAlertFingerprint === getAlertFingerprint() &&
    getLastAlertTime() - Date.now() < ALERT_SEND_INTERVAL
  )
}

function getAlertTypes(alertRec, config) {
  let alerts = []
  if (!isActive(config)) return alerts

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

function buildAlertFingerprint(alertRec, notifications) {
  const sms = getAlertTypes(alertRec, notifications.sms)
  const email = getAlertTypes(alertRec, notifications.email)
  if (sms.length === 0 && email.length === 0) return null

  const smsTypes = _.map(codeDisplay, _.uniq(_.map('code', sms))).sort()
  const emailTypes = _.map(codeDisplay, _.uniq(_.map('code', email))).sort()

  const subject = _.concat(smsTypes, emailTypes).join(', ')
  return crypto.createHash('sha256').update(subject).digest('hex')
}

function sendNoAlerts(plugins, smsEnabled, emailEnabled) {
  const subject = '[Lamassu] All clear'

  let rec = {}
  if (smsEnabled) {
    rec = _.set(['sms', 'body'])(subject)(rec)
  }

  if (emailEnabled) {
    rec = _.set(['email', 'subject'])(subject)(rec)
    rec = _.set(['email', 'body'])('No errors are reported for your machines.')(
      rec
    )
  }

  return plugins.sendMessage(rec)
}

module.exports = {
  codeDisplay,
  parseEventNote,
  getDeviceTime,
  checkPing,
  isActive,
  getAlertFingerprint,
  getLastAlertTime,
  setAlertFingerprint,
  shouldNotAlert,
  buildAlertFingerprint,
  sendNoAlerts
}
