const _ = require('lodash/fp')

const queries = require('./queries')
const utils = require('./utils')
const codes = require('./codes')
const customers = require('../customers')

const { NOTIFICATION_TYPES: {
  COMPLIANCE,
  CRYPTO_BALANCE,
  FIAT_BALANCE,
  ERROR,
  HIGH_VALUE_TX,
  NORMAL_VALUE_TX }
} = codes

const { STALE, PING } = codes

const sanctionsNotify = (customer, phone) => {
  const code = 'SANCTIONS'
  const detailB = utils.buildDetail({ customerId: customer.id, code })

  // if it's a new customer then phone comes as undefined
  if (phone) {
    return queries.addNotification(COMPLIANCE, `Blocked customer with phone ${phone} for being on the OFAC sanctions list`, detailB)
  }
  return customers.getById(customer.id).then(c => queries.addNotification(COMPLIANCE, `Blocked customer with phone ${c.phone} for being on the OFAC sanctions list`, detailB))
}

const clearOldCustomerSuspendedNotifications = (customerId, deviceId) => {
  const detailB = utils.buildDetail({ code: 'SUSPENDED', customerId, deviceId })
  return queries.invalidateNotification(detailB, 'compliance')
}

const customerComplianceNotify = (customer, deviceId, code, days = null) => {
  // code for now can be "BLOCKED", "SUSPENDED"
  const detailB = utils.buildDetail({ customerId: customer.id, code, deviceId })
  const date = new Date()
  if (days) {
    date.setDate(date.getDate() + days)
  }
  const message = code === 'SUSPENDED' ? `Customer suspended until ${date.toLocaleString()}` : `Customer blocked`

  return clearOldCustomerSuspendedNotifications(customer.id, deviceId)
    .then(() => queries.getValidNotifications(COMPLIANCE, detailB))
    .then(res => {
      if (res.length > 0) return Promise.resolve()
      return queries.addNotification(COMPLIANCE, message, detailB)
    })
    .catch(console.error)
}

const clearOldFiatNotifications = (balances) => {
  return queries.getAllValidNotifications(FIAT_BALANCE).then(notifications => {
    const filterByBalance = _.filter(notification => {
      const { cassette, deviceId } = notification.detail
      return !_.find(balance => balance.cassette === cassette && balance.deviceId === deviceId)(balances)
    })
    const indexesToInvalidate = _.compose(_.map('id'), filterByBalance)(notifications)
    const notInvalidated = _.filter(notification => {
      return !_.find(id => notification.id === id)(indexesToInvalidate)
    }, notifications)
    return (indexesToInvalidate.length ? queries.batchInvalidate(indexesToInvalidate) : Promise.resolve()).then(() => notInvalidated)
  })
}

const fiatBalancesNotify = (fiatWarnings) => {
  return clearOldFiatNotifications(fiatWarnings).then(notInvalidated => {
    return fiatWarnings.forEach(balance => {
      if (_.find(o => {
        const { cassette, deviceId } = o.detail
        return cassette === balance.cassette && deviceId === balance.deviceId
      }, notInvalidated)) return
      const message = `Cash-out cassette ${balance.cassette} almost empty!`
      const detailB = utils.buildDetail({ deviceId: balance.deviceId, cassette: balance.cassette })
      return queries.addNotification(FIAT_BALANCE, message, detailB)
    })
  })
}

const clearOldCryptoNotifications = balances => {
  return queries.getAllValidNotifications(CRYPTO_BALANCE).then(res => {
    const filterByBalance = _.filter(notification => {
      const { cryptoCode, code } = notification.detail
      return !_.find(balance => balance.cryptoCode === cryptoCode && balance.code === code)(balances)
    })
    const indexesToInvalidate = _.compose(_.map('id'), filterByBalance)(res)

    const notInvalidated = _.filter(notification => {
      return !_.find(id => notification.id === id)(indexesToInvalidate)
    }, res)
    return (indexesToInvalidate.length ? queries.batchInvalidate(indexesToInvalidate) : Promise.resolve()).then(() => notInvalidated)
  })
}

const cryptoBalancesNotify = (cryptoWarnings) => {
  return clearOldCryptoNotifications(cryptoWarnings).then(notInvalidated => {
    return cryptoWarnings.forEach(balance => {
      // if notification exists in DB and wasnt invalidated then don't add a duplicate
      if (_.find(o => {
        const { code, cryptoCode } = o.detail
        return code === balance.code && cryptoCode === balance.cryptoCode
      }, notInvalidated)) return

      const fiat = utils.formatCurrency(balance.fiatBalance.balance, balance.fiatCode)
      const message = `${balance.code === 'HIGH_CRYPTO_BALANCE' ? 'High' : 'Low'} balance in ${balance.cryptoCode} [${fiat}]`
      const detailB = utils.buildDetail({ cryptoCode: balance.cryptoCode, code: balance.code })
      return queries.addNotification(CRYPTO_BALANCE, message, detailB)
    })
  })
}

const balancesNotify = (balances) => {
  const cryptoFilter = o => o.code === 'HIGH_CRYPTO_BALANCE' || o.code === 'LOW_CRYPTO_BALANCE'
  const fiatFilter = o => o.code === 'LOW_CASH_OUT'
  const cryptoWarnings = _.filter(cryptoFilter, balances)
  const fiatWarnings = _.filter(fiatFilter, balances)
  return Promise.all([cryptoBalancesNotify(cryptoWarnings), fiatBalancesNotify(fiatWarnings)]).catch(console.error)
}

const clearOldErrorNotifications = alerts => {
  return queries.getAllValidNotifications(ERROR)
    .then(res => {
      // for each valid notification in DB see if it exists in alerts
      // if the notification doesn't exist in alerts, it is not valid anymore
      const filterByAlert = _.filter(notification => {
        const { code, deviceId } = notification.detail
        return !_.find(alert => alert.code === code && alert.deviceId === deviceId)(alerts)
      })
      const indexesToInvalidate = _.compose(_.map('id'), filterByAlert)(res)
      if (!indexesToInvalidate.length) return Promise.resolve()
      return queries.batchInvalidate(indexesToInvalidate)
    })
    .catch(console.error)
}

const errorAlertsNotify = (alertRec) => {
  const embedDeviceId = deviceId => _.assign({ deviceId })
  const mapToAlerts = _.map(it => _.map(embedDeviceId(it), alertRec.devices[it].deviceAlerts))
  const alerts = _.compose(_.flatten, mapToAlerts, _.keys)(alertRec.devices)

  return clearOldErrorNotifications(alerts).then(() => {
    _.forEach(alert => {
      switch (alert.code) {
        case PING: {
          const detailB = utils.buildDetail({ code: PING, age: alert.age ? alert.age : -1, deviceId: alert.deviceId })
          return queries.getValidNotifications(ERROR, _.omit(['age'], detailB)).then(res => {
            if (res.length > 0) return Promise.resolve()
            const message = `Machine down`
            return queries.addNotification(ERROR, message, detailB)
          })
        }
        case STALE: {
          const detailB = utils.buildDetail({ code: STALE, deviceId: alert.deviceId })
          return queries.getValidNotifications(ERROR, detailB).then(res => {
            if (res.length > 0) return Promise.resolve()
            const message = `Machine is stuck on ${alert.state} screen`
            return queries.addNotification(ERROR, message, detailB)
          })
        }
      }
    }, alerts)
  }).catch(console.error)
}

function notifCenterTransactionNotify (isHighValue, direction, fiat, fiatCode, deviceId, cryptoAddress) {
  const messageSuffix = isHighValue ? 'High value' : ''
  const message = `${messageSuffix} ${fiat} ${fiatCode} ${direction} transaction`
  const detailB = utils.buildDetail({ deviceId: deviceId, direction, fiat, fiatCode, cryptoAddress })
  return queries.addNotification(isHighValue ? HIGH_VALUE_TX : NORMAL_VALUE_TX, message, detailB)
}

const blacklistNotify = (tx, isAddressReuse) => {
  const code = isAddressReuse ? 'REUSED' : 'BLOCKED'
  const name = isAddressReuse ? 'reused' : 'blacklisted'

  const detailB = utils.buildDetail({ cryptoCode: tx.cryptoCode, code, cryptoAddress: tx.toAddress })
  const message = `Blocked ${name} address: ${tx.cryptoCode} ${tx.toAddress.substr(0, 10)}...`
  return queries.addNotification(COMPLIANCE, message, detailB)
}

module.exports = {
  sanctionsNotify,
  customerComplianceNotify,
  balancesNotify,
  errorAlertsNotify,
  notifCenterTransactionNotify,
  blacklistNotify
}
