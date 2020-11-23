const { STALE, STALE_STATE } = require('./codes')

const _ = require('lodash/fp')
const queries = require('./queries')
const logger = require('../logger')

const utils = require('./utils')
const emailFuncs = require('./email')
const smsFuncs = require('./sms')

function buildMessage(alerts, notifications) {
  const smsEnabled = utils.isActive(notifications.sms)
  const emailEnabled = utils.isActive(notifications.email)

  let rec = {}
  if (smsEnabled) {
    rec = _.set(['sms', 'body'])(
      smsFuncs.printSmsAlerts(alerts, notifications.sms)
    )(rec)
  }
  if (emailEnabled) {
    rec = _.set(['email', 'subject'])(
      emailFuncs.alertSubject(alerts, notifications.email)
    )(rec)
    rec = _.set(['email', 'body'])(
      emailFuncs.printEmailAlerts(alerts, notifications.email)
    )(rec)
  }

  return rec
}

function checkNotification(plugins) {
  const notifications = plugins.getNotificationConfig()
  const smsEnabled = utils.isActive(notifications.sms)
  const emailEnabled = utils.isActive(notifications.email)

  if (!smsEnabled && !emailEnabled) return Promise.resolve()

  return getAlerts(plugins)
    .then(alerts => {
      const currentAlertFingerprint = utils.buildAlertFingerprint(
        alerts,
        notifications
      )
      if (!currentAlertFingerprint) {
        const inAlert = !!utils.getAlertFingerprint()
        // (fingerprint = null, lastAlertTime = null)
        utils.setAlertFingerprint(null, null)
        if (inAlert) {
          return utils.sendNoAlerts(plugins, smsEnabled, emailEnabled)
        }
      }
      if (utils.shouldNotAlert(currentAlertFingerprint)) {
        return
      }

      const message = buildMessage(alerts, notifications)
      utils.setAlertFingerprint(currentAlertFingerprint, Date.now())
      return plugins.sendMessage(message)
    })
    .then(results => {
      if (results && results.length > 0)
        logger.debug('Successfully sent alerts')
    })
    .catch(logger.error)
}

function getAlerts(plugins) {
  return Promise.all([
    plugins.checkBalances(),
    queries.machineEvents(),
    plugins.getMachineNames()
  ]).then(([balances, events, devices]) =>
    buildAlerts(checkPings(devices), balances, events, devices)
  )
}

function buildAlerts(pings, balances, events, devices) {
  const alerts = { devices: {}, deviceNames: {} }
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
    alerts.devices[deviceId].balanceAlerts = _.filter(
      ['deviceId', deviceId],
      balances
    )
    alerts.devices[deviceId].deviceAlerts = _.isEmpty(ping) ? stuckScreen : ping

    alerts.deviceNames[deviceId] = deviceName
  })
  return alerts
}

function checkPings(devices) {
  const deviceIds = _.map('deviceId', devices)
  const pings = _.map(utils.checkPing, devices)
  return _.zipObject(deviceIds)(pings)
}

function checkStuckScreen(deviceEvents, machineName) {
  const sortedEvents = _.sortBy(
    utils.getDeviceTime,
    _.map(utils.parseEventNote, deviceEvents)
  )
  const lastEvent = _.last(sortedEvents)

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

module.exports = {
  checkNotification,
  checkPings,
  checkStuckScreen
}
