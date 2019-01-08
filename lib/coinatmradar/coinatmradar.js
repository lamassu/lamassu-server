const axios = require('axios')
const _ = require('lodash/fp')
const hkdf = require('futoin-hkdf')

const pify = require('pify')
const fs = pify(require('fs'))

const db = require('../db')
const mnemonicHelpers = require('../mnemonic-helpers')
const configManager = require('../config-manager')
const options = require('../options')
const logger = require('../logger')

const TIMEOUT = 10000
const MAX_CONTENT_LENGTH = 2000

// How long a machine can be down before it's considered offline
const STALE_INTERVAL = '2 minutes'

module.exports = { update, mapRecord }

function mapCoin (info, deviceId, cryptoCode) {
  const config = info.config
  const rates = info.rates[cryptoCode] || { cashIn: null, cashOut: null }
  const cryptoConfig = configManager.scoped(cryptoCode, deviceId, config)
  const unscoped = configManager.unscoped(config)
  const showRates = unscoped.coinAtmRadarShowRates

  const cashInFee = showRates ? cryptoConfig.cashInCommission / 100 : null
  const cashOutFee = showRates ? cryptoConfig.cashOutCommission / 100 : null
  const cashInRate = showRates ? _.invoke('cashIn.toNumber', rates) : null
  const cashOutRate = showRates ? _.invoke('cashOut.toNumber', rates) : null

  return {
    cryptoCode,
    cashInFee,
    cashOutFee,
    cashInRate,
    cashOutRate
  }
}

function mapIdentification (info, deviceId) {
  const machineConfig = configManager.machineScoped(deviceId, info.config)

  return {
    isPhone: machineConfig.smsVerificationActive,
    isPalmVein: false,
    isPhoto: false,
    isIdDocScan: machineConfig.idCardDataVerificationActive,
    isFingerprint: false
  }
}

function mapMachine (info, machineRow) {
  const deviceId = machineRow.device_id
  const config = info.config
  const machineConfig = configManager.machineScoped(deviceId, config)

  const lastOnline = machineRow.last_online.toISOString()
  const status = machineRow.stale ? 'online' : 'offline'

  const cashLimit = machineConfig.hardLimitVerificationActive
    ? machineConfig.hardLimitVerificationThreshold
    : Infinity

  const cryptoCurrencies = machineConfig.cryptoCurrencies
  const identification = mapIdentification(info, deviceId)
  const coins = _.map(_.partial(mapCoin, [info, deviceId]), cryptoCurrencies)

  return {
    machineId: deviceId,
    address: {
      streetAddress: null,
      city: null,
      region: null,
      postalCode: null,
      country: null
    },
    location: {
      name: null,
      url: null,
      phone: null
    },
    status,
    lastOnline,
    cashIn: true,
    cashOut: machineConfig.cashOutEnabled,
    manufacturer: 'lamassu',
    cashInTxLimit: cashLimit,
    cashOutTxLimit: cashLimit,
    cashInDailyLimit: cashLimit,
    cashOutDailyLimit: cashLimit,
    fiatCurrency: machineConfig.fiatCurrency,
    identification,
    coins
  }
}

function getMachines (info) {
  const sql = `select device_id, last_online, now() - last_online < $1 as stale from devices
  where display=TRUE and
  paired=TRUE
  order by created`

  return db.any(sql, [STALE_INTERVAL])
    .then(_.map(_.partial(mapMachine, [info])))
}

function sendRadar (data) {
  const url = _.get(['coinAtmRadar', 'url'], options)

  if (_.isEmpty(url)) {
    return Promise.reject(new Error('Missing coinAtmRadar url!'))
  }

  const config = {
    url,
    method: 'post',
    data,
    timeout: TIMEOUT,
    maxContentLength: MAX_CONTENT_LENGTH
  }

  console.log('%j', data)

  return axios(config)
    .then(r => console.log(r.status))
}

function mapRecord (info) {
  const timestamp = new Date().toISOString()
  return Promise.all([getMachines(info), fs.readFile(options.mnemonicPath, 'utf8')])
    .then(([machines, mnemonic]) => {
      return {
        operatorId: computeOperatorId(mnemonicHelpers.toEntropyBuffer(mnemonic)),
        operator: {
          name: null,
          phone: null,
          email: null
        },
        timestamp,
        machines
      }
    })
}

function update (info) {
  const config = configManager.unscoped(info.config)

  if (!config.coinAtmRadarActive) return Promise.resolve()

  return mapRecord(info)
    .then(sendRadar)
    .catch(err => logger.error(`Failure to update CoinATMRadar`, err))
}

function computeOperatorId (masterSeed) {
  return hkdf(masterSeed, 16, { salt: 'lamassu-server-salt', info: 'operator-id' }).toString('hex')
}
