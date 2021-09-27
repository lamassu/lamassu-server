const { BigNumber } = require('bignumber.js')
const ph = require('./plugin-helper')
const argv = require('minimist')(process.argv.slice(2))
const { getTx } = require('./new-admin/services/transactions.js')
const { getCustomerById } = require('./customers')
const configManager = require('./new-config-manager')
const machineLoader = require('./machine-loader')
const { utils: coinUtils } = require('lamassu-coins')

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
  return cryptoAtoms.shift(-unitScale)
}

function buildSms (data, receiptOptions) {
  return getTx(data.session, data.txClass)
    .then(tx => {
      Promise.all([getCustomerById(tx.customer_id), machineLoader.getConfig(), machineLoader.getMachine()])
        .then(([customer, config, deviceConfig]) => {
          const localeConfig = configManager.getLocale(tx.device_id, config)
          const timezone = localeConfig.timezone.split(':')
          const dstOffset = timezone[1]

          const cashInCommission = BigNumber(1).add(BigNumber(tx.commissionPercentage))

          const rate = BigNumber(tx.rawTickerPrice).mul(cashInCommission).round(2)
          const date = new Date()
          date.setMinutes(date.getMinutes() + parseInt(dstOffset))
          const dateString = `${date.toISOString().replace('T', ' ').slice(0, 19)}`

          const data = {
            operatorInfo: configManager.getOperatorInfo(config),
            location: deviceConfig.machineLocation,
            customerName: customer.name,
            customerPhone: customer.phone,
            session: tx.id,
            time: dateString,
            direction: tx.direction === 'cashIn' ? 'Cash-in' : 'Cash-out',
            fiat: `${tx.fiat.toString()} ${tx.fiatCode}`,
            crypto: `${toCryptoUnits(tx.cryptoAtoms, tx.cryptoCode)} ${tx.cryptoCode}`,
            rate: `1 ${tx.cryptoCode} = ${rate} ${tx.fiatCode}`,
            address: tx.toAddress,
            txId: tx.txHash
          }

          return formatSmsReceipt(data, receiptOptions)
        })
    })
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

module.exports = { sendMessage, formatSmsReceipt, getLookup, buildSms }
