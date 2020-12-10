const _ = require('lodash/fp')

const configManager = require('../new-config-manager')
const logger = require('../logger')
const machineLoader = require('../machine-loader')
const queries = require('./queries')
const settingsLoader = require('../new-settings-loader')
const customers = require('../customers')

const utils = require('./utils')
const emailFuncs = require('./email')
const smsFuncs = require('./sms')
const { STALE, STALE_STATE } = require('./codes')

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

async function transactionNotify (tx, rec) {
  const settings = await settingsLoader.loadLatest()
  const notifSettings = configManager.getGlobalNotifications(settings.config)
  const highValueTx = tx.fiat.gt(notifSettings.highValueTransaction || Infinity)
  const isCashOut = tx.direction === 'cashOut'
  
  // high value tx on database
  if(highValueTx && tx.direction === 'cashIn' || highValueTx && tx.direction === 'cashOut' && rec.isRedemption) {
    queries.addHighValueTx(tx)
  }
  
  // alert through sms or email any transaction or high value transaction, if SMS || email alerts are enabled
  const cashOutConfig = configManager.getCashOut(tx.deviceId, settings.config)
  const zeroConfLimit = cashOutConfig.zeroConfLimit
  const zeroConf = isCashOut && tx.fiat.lte(zeroConfLimit)
  const notificationsEnabled = notifSettings.sms.transactions || notifSettings.email.transactions
  const customerPromise = tx.customerId ? customers.getById(tx.customerId) : Promise.resolve({})
  
  if (!notificationsEnabled && !highValueTx) return Promise.resolve()
  if (zeroConf && isCashOut && !rec.isRedemption && !rec.error) return Promise.resolve()
  if (!zeroConf && rec.isRedemption) return sendRedemptionMessage(tx.id, rec.error)

  return Promise.all([
    machineLoader.getMachineName(tx.deviceId),
    customerPromise
  ])
  .then(([machineName, customer]) => {
    return utils.buildTransactionMessage(tx, rec, highValueTx, machineName, customer)
  })
  .then(([msg, highValueTx]) => sendTransactionMessage(msg, highValueTx))
}

function sendRedemptionMessage(txId, error) {
  const subject = `Here's an update on transaction ${txId}`
  const body = error
    ? `Error: ${error}`
    : 'It was just dispensed successfully'

  const rec = {
    sms: {
      body: `${subject} - ${body}`
    },
    email: {
      subject,
      body
    }
  }
  return sendTransactionMessage(rec)
}

async function sendTransactionMessage(rec, isHighValueTx) {
  const settings = await settingsLoader.loadLatest()
  const notifications = configManager.getGlobalNotifications(settings.config)

  let promises = []

  const emailActive =
    notifications.email.active &&
    (notifications.email.transactions || isHighValueTx)
  if (emailActive) promises.push(emailFuncs.sendMessage(settings, rec))

  const smsActive =
    notifications.sms.active &&
    (notifications.sms.transactions || isHighValueTx)
  if (smsActive) promises.push(smsFuncs.sendMessage(settings, rec))

  return Promise.all(promises)
}

const cashCassettesNotify = (cassettes, deviceId) => {
  settingsLoader.loadLatest()
  .then(settings =>
    [
      configManager.getNotifications(null, deviceId, settings.config),
      configManager.getCashOut(deviceId,settings.config).active
    ])
  .then(([notifications, cashOutEnabled]) => {
    const cassette1Count = cassettes.cassette1
    const cassette2Count = cassettes.cassette2
    const cassette1Threshold = notifications.fiatBalanceCassette1
    const cassette2Threshold = notifications.fiatBalanceCassette2

    if(cashOutEnabled) {
      // we only want to add this notification if there isn't one already set and unread in the database
      Promise.all([queries.getUnreadCassetteNotifications(1), queries.getUnreadCassetteNotifications(2)]).then(res => {
        if(res[0].length === 0 && cassette1Count < cassette1Threshold) {
          console.log("Adding fiatBalance alert for cashbox 1 in database - count & threshold: ", cassette1Count, cassette1Threshold )
          queries.addCashCassetteWarning(1, deviceId)
        }
        if(res[1].length === 0 && cassette2Count < cassette2Threshold) {
          console.log("Adding fiatBalance alert for cashbox 2 in database - count & threshold: ", cassette2Count, cassette2Threshold )
          queries.addCashCassetteWarning(2, deviceId)
        }
      })
    }
  })
}

module.exports = {
  transactionNotify,
  checkNotification,
  checkPings,
  checkStuckScreen,
  sendRedemptionMessage,
  cashCassettesNotify
}
