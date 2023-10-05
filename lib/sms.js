const ph = require('./plugin-helper')
const { utils: coinUtils } = require('@lamassu/coins')
const _ = require('lodash/fp')

const smsNotices = require('./sms-notices')
const { RECEIPT } = require('./constants')

function getSms (event, phone, content) {
  return smsNotices.getSMSNotice(event)
    .then(msg => {
      if (!_.isNil(msg)) {
        var accMsg = msg.message
        const contentKeys = _.keys(content)
        const messageContent = _.reduce((acc, it) => _.replace(`#${it}`, content[it], acc), accMsg, contentKeys)
        return {
          toNumber: phone,
          body: messageContent
        }
      }
    })
}

function getPlugin (settings) {
  const smsProvider = settings.config.notifications_thirdParty_sms
  const pluginCode = smsProvider ?? 'twilio'
  const plugin = ph.load(ph.SMS, pluginCode)
  const account = settings.accounts[pluginCode]

  return { plugin, account }
}

function sendMessage (settings, rec) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = getPlugin(settings)
      return plugin.sendMessage(account, rec)
    })
}

function getLookup (settings, number) {
  return Promise.resolve()
    .then(() => {
      const { plugin, account } = getPlugin(settings)
      return plugin.getLookup(account, number)
    })
}
const toCryptoUnits = (cryptoAtoms, cryptoCode) => {
  const unitScale = coinUtils.getCryptoCurrency(cryptoCode).unitScale
  return cryptoAtoms.shiftedBy(-unitScale)
}

function formatSmsReceipt (data, options) {
  var message = `RECEIPT\n`
  if (data.operatorInfo) {
    message = message.concat(`Operator information:\n`)
    if (data.operatorInfo.name) {
      message = message.concat(`${data.operatorInfo.name}\n`)
    }

    if (data.operatorInfo.website && options.operatorWebsite) {
      message = message.concat(`${data.operatorInfo.website}\n`)
    }

    if (data.operatorInfo.email && options.operatorEmail) {
      message = message.concat(`${data.operatorInfo.email}\n`)
    }

    if (data.operatorInfo.phone && options.operatorPhone) {
      message = message.concat(`${data.operatorInfo.phone}\n`)
    }

    if (data.operatorInfo.companyNumber && options.companyNumber) {
      message = message.concat(`${data.operatorInfo.companyNumber}\n`)
    }
  }
  if (data.location && options.machineLocation) {
    message = message.concat(`Location: ${data.location}\n`)
  }

  if (options.customerNameOrPhoneNumber) {
    if (data.customerName) {
      message = message.concat(`Customer: ${data.customerName}\n`)
    } else {
      message = message.concat(`Customer: ${data.customerPhone}\n`)
    }
  }

  message = message.concat(`Session: ${data.session}\n`)
  message = message.concat(`Time: ${data.time}\n`)
  message = message.concat(`Direction: ${data.direction}\n`)
  message = message.concat(`Fiat: ${data.fiat}\n`)
  message = message.concat(`Crypto: ${data.crypto}\n`)

  if (data.rate && options.exchangeRate) {
    message = message.concat(`Rate: ${data.rate}\n`)
  }

  message = message.concat(`TXID: ${data.txId}\n`)

  if (data.address && options.addressQRCode) {
    message = message.concat(`Address: ${data.address}\n`)
  }

  const timestamp = `${(new Date()).toISOString().substring(11, 19)} UTC`

  const postReceiptSmsPromise = getSms(RECEIPT, data.customerPhone, { timestamp })

  return Promise.all([smsNotices.getSMSNotice(RECEIPT), postReceiptSmsPromise])
    .then(([res, postReceiptSms]) => ({
      sms: {
        toNumber: data.customerPhone,
        body: res.enabled ? message.concat('\n\n', postReceiptSms.body) : message
      }
    }))
}

module.exports = {
  getSms,
  sendMessage,
  getLookup,
  formatSmsReceipt,
  toCryptoUnits
}
