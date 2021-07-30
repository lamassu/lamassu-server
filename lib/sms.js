const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))
const { utils: coinUtils } = require('lamassu-coins')
const _ = require('lodash/fp')

const customSms = require('./custom-sms')

function getPhoneCodeSms (deviceId, phone, code) {
  return Promise.all([
    customSms.getCommonCustomMessages('sms_code'),
    customSms.getMachineCustomMessages('sms_code', deviceId)
  ])
    .then(([commonMsg, machineMsg]) => {
      if (!_.isNil(machineMsg)) {
        const messageContent = _.replace('#code', code, machineMsg.message)
        return {
          toNumber: phone,
          body: messageContent
        }
      }

      if (!_.isNil(commonMsg)) {
        const messageContent = _.replace('#code', code, commonMsg.message)
        return {
          toNumber: phone,
          body: messageContent
        }
      }

      return {
        toNumber: phone,
        body: `Your cryptomat code: ${code}`
      }
    })
}

function getCashOutReadySms (deviceId, phone, timestamp) {
  return Promise.all([
    customSms.getCommonCustomMessages('cash_out_dispense_ready'),
    customSms.getMachineCustomMessages('cash_out_dispense_ready', deviceId)
  ])
    .then(([commonMsg, machineMsg]) => {
      if (!_.isNil(machineMsg)) {
        const messageContent = _.replace('#timestamp', timestamp, machineMsg.message)
        return {
          toNumber: phone,
          body: messageContent
        }
      }

      if (!_.isNil(commonMsg)) {
        const messageContent = _.replace('#timestamp', timestamp, commonMsg.message)
        return {
          toNumber: phone,
          body: messageContent
        }
      }

      return {
        toNumber: phone,
        body: `Your cash is waiting! Go to the Cryptomat and press Redeem within 24 hours. [${timestamp}]`
      }
    })
}

function getPlugin (settings) {
  const pluginCode = argv.mockSms ? 'mock-sms' : 'twilio'
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

  const request = {
    sms: {
      toNumber: data.customerPhone,
      body: message
    }
  }
  return request
}

module.exports = {
  getPhoneCodeSms,
  getCashOutReadySms,
  sendMessage,
  getLookup,
  formatSmsReceipt,
  toCryptoUnits
}
