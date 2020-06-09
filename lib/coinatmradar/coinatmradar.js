const axios = require('axios')
const _ = require('lodash/fp')
const hkdf = require('futoin-hkdf')

const pify = require('pify')
const fs = pify(require('fs'))

const db = require('../db')
const mnemonicHelpers = require('../mnemonic-helpers')
const configManager = require('../new-config-manager')
const complianceTriggers = require('../compliance-triggers')
const options = require('../options')
const logger = require('../logger')
const plugins = require('../plugins')

const TIMEOUT = 10000
const MAX_CONTENT_LENGTH = 2000

// How long a machine can be down before it's considered offline
const STALE_INTERVAL = '2 minutes'

module.exports = { update }

function mapCoin (rates, deviceId, settings, cryptoCode) {
  const config = settings.config
  const buildedRates = plugins(settings, deviceId).buildRates(rates)[cryptoCode] || { cashIn: null, cashOut: null }

  const commissions = configManager.getCommissions(cryptoCode, deviceId, config)
  const coinAtmRadar = configManager.getCoinAtmRadar(config)

  const showCommissions = coinAtmRadar.commissions

  const cashInFee = showCommissions ? commissions.cashIn / 100 : null
  const cashOutFee = showCommissions ? commissions.cashOut / 100 : null
  const cashInRate = showCommissions ? _.invoke('cashIn.toNumber', buildedRates) : null
  const cashOutRate = showCommissions ? _.invoke('cashOut.toNumber', buildedRates) : null

  return {
    cryptoCode,
    cashInFee,
    cashOutFee,
    cashInFixedFee,
    cashInRate,
    cashOutRate
  }
}

function mapIdentification (config, deviceId) {
  const triggers = configManager.getTriggers(deviceId, config)
  const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)

  return {
    isPhone: !!compatTriggers.sms,
    isPalmVein: false,
    isPhoto: !!compatTriggers.facephoto,
    isIdDocScan: !!compatTriggers.idData,
    isFingerprint: false
  }
}

function mapMachine (rates, settings, machineRow) {
  const deviceId = machineRow.device_id
  const config = settings.config

  const coinAtmRadar = configManager.getCoinAtmRadar(config)
  const triggers = configManager.getTriggers(deviceId, config)
  const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
  const locale = configManager.getLocale(deviceId, config)
  const cashOutConfig = configManager.getCashOut(deviceId, config)

  const lastOnline = machineRow.last_online.toISOString()
  const status = machineRow.stale ? 'online' : 'offline'
  const showSupportedCryptocurrencies = coinAtmRadar.supportedCryptocurrencies
  const showSupportedFiat = coinAtmRadar.supportedFiat
  const showSupportedBuySellDirection = coinAtmRadar.supportedBuySellDirection
  const showLimitsAndVerification = coinAtmRadar.limitsAndVerification

  // TODO new-admin: this is relaying info with backwards compatible triggers
  // need to get in touch with coinatmradar before updating this
  const cashLimit = showLimitsAndVerification ? (
    !!compatTriggers.block
    ? compatTriggers.block
    : Infinity ) : null

  const cryptoCurrencies = locale.cryptoCurrencies
  const cashInEnabled = showSupportedBuySellDirection ? true : null
  const cashOutEnabled = showSupportedBuySellDirection ? cashOutConfig.active : null
  const fiat = showSupportedFiat ? locale.fiatCurrency : null
  const identification = mapIdentification(config, deviceId)
  const coins = showSupportedCryptocurrencies ? 
    _.map(_.partial(mapCoin, [rates, deviceId, settings]), cryptoCurrencies)
    : null

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
    cashIn: cashInEnabled,
    cashOut: cashOutEnabled,
    manufacturer: 'lamassu',
    cashInTxLimit: cashLimit,
    cashOutTxLimit: cashLimit,
    cashInDailyLimit: cashLimit,
    cashOutDailyLimit: cashLimit,
    fiatCurrency: fiat,
    identification,
    coins
  }
}

function getMachines (rates, settings) {
  const sql = `select device_id, last_online, now() - last_online < $1 as stale from devices
  where display=TRUE and
  paired=TRUE
  order by created`

  return db.any(sql, [STALE_INTERVAL])
    .then(_.map(_.partial(mapMachine, [rates, settings])))
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

function mapRecord (rates, settings) {
  const timestamp = new Date().toISOString()
  return Promise.all([getMachines(rates, settings), fs.readFile(options.mnemonicPath, 'utf8')])
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

function update (rates, settings) {
  const coinAtmRadar = configManager.getCoinAtmRadar(settings.config)

  if (!coinAtmRadar.active) return Promise.resolve()

  return mapRecord(rates, settings)
    .then(sendRadar)
    .catch(err => logger.error(`Failure to update CoinATMRadar`, err))
}

function computeOperatorId (masterSeed) {
  return hkdf(masterSeed, 16, { salt: 'lamassu-server-salt', info: 'operator-id' }).toString('hex')
}
