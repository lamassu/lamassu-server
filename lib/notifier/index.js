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
const { STALE, STALE_STATE, PING } = require('./codes')

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
      errorAlertsNotify(alerts)
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
  ]).then(([balances, events, devices]) => {
    balancesNotify(balances)
    return buildAlerts(checkPings(devices), balances, events, devices)
  })
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
      Promise.all([queries.getUnreadCassetteNotifications(1, deviceId), queries.getUnreadCassetteNotifications(2, deviceId)]).then(res => {
        if(res[0].length === 0 && cassette1Count < cassette1Threshold) {
          console.log("Adding fiatBalance alert for cashbox 1 in database - count & threshold: ", cassette1Count, cassette1Threshold )
          return queries.addCashCassetteWarning(1, deviceId)
        }
        if(res[1].length === 0 && cassette2Count < cassette2Threshold) {
          console.log("Adding fiatBalance alert for cashbox 2 in database - count & threshold: ", cassette2Count, cassette2Threshold )
          return queries.addCashCassetteWarning(2, deviceId)
        }
      })
    }
  })
}


/*
  Notes for new "valid" column on notifications table:

  - We only want to add a new notification if it is present in the high or low warning consts.
  - Before we add the notification we need to see if there is no "valid" notification in the database.
  - Since the poller runs every few seconds, if the user marks it as read, this code would add a new notification
  immediately. This new column helps us decide if a new notification should be added.
  - "Valid" is defaulted to "true". When the cryptobalance goes over the low threshold or under the high threshold,
  the notification will be marked as invalid. This will allow a new one to be sent. If the cryptobalance never goes
  into the middle of the high and low thresholds, the old, "read" notification will still be relevant so we won't add
  a new one.
*/

const clearOldCryptoNotifications = (balances) => {
  // get valid crypto notifications from DB
  // if that notification doesn't exist in balances, then make it invalid on the DB
  queries.getAllValidNotifications('cryptoBalance').then(res => {
    const notifications = _.map(it => {
      return {
        cryptoCode: it.detail.split('_')[0],
        code: it.detail.split('_').splice(1).join('_')
      }
    }, res)
    _.forEach(notification => {
      const idx = _.findIndex(balance => {
        return balance.code === notification.code && balance.cryptoCode === notification.cryptoCode
      }, balances)

      if(idx !== -1) {
        return
      }
      // if the notification doesn't exist in the new balances object, then it is outdated and is not valid anymore
      return queries.invalidateNotification(notification.id)
    }, notifications)
  })
}

const balancesNotify = (balances) => {
  const highFilter = o => o.code === 'HIGH_CRYPTO_BALANCE'
  const lowFilter = o => o.code === 'LOW_CRYPTO_BALANCE'
  const highWarnings = _.filter(highFilter, balances)
  const lowWarnings = _.filter(lowFilter, balances)

  clearOldCryptoNotifications(balances)

  highWarnings.forEach(warning => {
    queries.getValidNotifications('cryptoBalance', `${warning.cryptoCode}_${warning.code}`).then(res => {
      if (res.length > 0) {
        return Promise.resolve()
      }
      console.log("Adding high balance alert for " + warning.cryptoCode + " - " + warning.fiatBalance.balance)
      const balance = utils.formatCurrency(warning.fiatBalance.balance, warning.fiatCode)
      return queries.addCryptoBalanceWarning(`${warning.cryptoCode}_${warning.code}`, `High balance in ${warning.cryptoCode} [${balance}]`)
    })
  })
  lowWarnings.forEach(warning => {
    queries.getValidNotifications('cryptoBalance', `${warning.cryptoCode}_${warning.code}`).then(res => {
      if (res.length > 0) {
        return Promise.resolve()
      }
      console.log("Adding low balance alert for " + warning.cryptoCode + " - " + warning.fiatBalance.balance)
      const balance = utils.formatCurrency(warning.fiatBalance.balance, warning.fiatCode)
      return queries.addCryptoBalanceWarning(`${warning.cryptoCode}_${warning.code}`, `Low balance in ${warning.cryptoCode} [${balance}]`)
    })
  })
}

const clearOldErrorNotifications = (alerts) => {
  queries.getAllValidNotifications('error').then(res => {
    _.forEach(notification => {
      const idx = _.findIndex(alert => {
        return alert.code === notification.detail.split('_')[0] && alert.deviceId === notification.device_id
      }, alerts)
      if(idx !== -1) {
        return
      }
      // if the notification doesn't exist, then it is outdated and is not valid anymore
      return queries.invalidateNotification(notification.id)
    }, res)
  })
}

const errorAlertsNotify = (alertRec) => {
  let alerts = []
  _.keys(alertRec.devices).forEach(function (device) {
    // embed device ID in each alert object inside the deviceAlerts array
    alertRec.devices[device].deviceAlerts = _.map(alert => {
      return {...alert, deviceId: device}
    }, alertRec.devices[device].deviceAlerts)
    // concat every array into one
    alerts = _.concat(alerts, alertRec.devices[device].deviceAlerts)
  })
  
  //    now that we have all the alerts, we want to add PING and STALE alerts to the DB
  //    if there is a valid alert on the DB that doesn't exist on the new alerts array,
  // that alert should be considered invalid
  //    after that, for the alerts array, we have to see if there is a valid alert of 
  // the sorts already on the DB
  clearOldErrorNotifications(alerts)

  _.forEach(alert => {
    switch(alert.code) {
      case PING:
        return queries.getValidNotifications('error', PING, alert.deviceId).then(res => {
          if(res.length > 0) {
            return Promise.resolve()
          }
          console.log("Adding PING alert on database for " + alert.machineName)
          const message = `Machine down`
          return queries.addErrorNotification(`${PING}_${alert.age ? alert.age : '-1'}`, message, alert.deviceId)
        })
      case STALE:
        return queries.getValidNotifications('error', STALE, alert.deviceId).then(res => {
          if(res.length > 0) {
            return Promise.resolve()
          }
          console.log("Adding STALE alert on database for " + alert.machineName)
          const message = `Machine is stuck on ${alert.state} screen`
          return queries.addErrorNotification(STALE, message, alert.deviceId)
        })
      default:
        return
    }
  }, alerts)
}

const blacklistNotify = (tx, isAddressReuse) => {
  let detail = ''
  let message = ''
  if(isAddressReuse) {
    detail = `${tx.cryptoCode}_REUSED_${tx.toAddress}`
    message = `Blocked reused address: ${tx.cryptoCode} ${tx.toAddress.substr(0,10)}...`
  } else {
    detail = `${tx.cryptoCode}_BLOCKED_${tx.toAddress}`
    message = `Blocked blacklisted address: ${tx.cryptoCode} ${tx.toAddress.substr(0,10)}...`
  }

  return queries.addComplianceNotification(tx.deviceId, detail, message)
}

const clearOldCustomerSuspendedNotifications = (customerId, deviceId) => {
  const detail = `SUSPENDED_${customerId}`
  return queries.invalidateNotification(null, detail, deviceId)
}

const customerComplianceNotify = (customer, deviceId, prefix, days = null) => {
  // prefix can be "BLOCKED", "SUSPENDED", etc
  const detail = `${prefix}_${customer.id}`
  const date = new Date()
  if (days) {
    date.setDate(date.getDate() + days)
  }
  const message = prefix === "SUSPENDED" ? `Customer suspended until ${date.toLocaleString()}` : `Customer blocked`

  // we have to clear every notification for this user where the suspension ended before the current date
  clearOldCustomerSuspendedNotifications(customer.id, deviceId).then(() => {
    return queries.getValidNotifications('compliance', detail, deviceId)
  }).then(res => {
    if (res.length > 0) {
      return Promise.resolve()
    }
    return queries.addComplianceNotification(deviceId, detail, message)
  })
}

module.exports = {
  transactionNotify,
  checkNotification,
  checkPings,
  checkStuckScreen,
  sendRedemptionMessage,
  cashCassettesNotify,
  blacklistNotify,
  customerComplianceNotify,
}
