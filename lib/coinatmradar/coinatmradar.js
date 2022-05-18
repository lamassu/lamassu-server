const axios = require('axios')
const _ = require('lodash/fp')

const db = require('../db')
const configManager = require('../new-config-manager')
const complianceTriggers = require('../compliance-triggers')
const logger = require('../logger')
const plugins = require('../plugins')
const { getOperatorId } = require('../operator')

const TIMEOUT = 10000
const MAX_CONTENT_LENGTH = 2000

const COIN_ATM_RADAR_URL = process.env.COIN_ATM_RADAR_URL

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
  const cashInFixedFee = showCommissions ? commissions.fixedFee : null
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

function mapIdentification (config) {
  const triggers = configManager.getTriggers(config)

  return {
    isPhone: complianceTriggers.hasPhone(triggers),
    isPalmVein: false,
    isPhoto: complianceTriggers.hasFacephoto(triggers),
    isIdDocScan: complianceTriggers.hasIdScan(triggers),
    isFingerprint: false
  }
}

function mapMachine (rates, settings, machineRow) {
  const deviceId = machineRow.device_id
  const config = settings.config

  const coinAtmRadar = configManager.getCoinAtmRadar(config)
  const triggers = configManager.getTriggers(config)
  const locale = configManager.getLocale(deviceId, config)
  const cashOutConfig = configManager.getCashOut(deviceId, config)
  const cashOutEnabled = cashOutConfig.active ? cashOutConfig.active : false

  const lastOnline = machineRow.last_online.toISOString()
  const status = machineRow.stale ? 'online' : 'offline'
  const showLimitsAndVerification = coinAtmRadar.limitsAndVerification
  const cashLimit = showLimitsAndVerification ? (_.get('threshold', complianceTriggers.getCashLimit(triggers)) || Infinity) : null
  const cryptoCurrencies = locale.cryptoCurrencies
  const identification = mapIdentification(config)
  const coins = _.map(_.partial(mapCoin, [rates, deviceId, settings]), cryptoCurrencies)
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
    cashOut: cashOutEnabled,
    manufacturer: 'lamassu',
    cashInTxLimit: cashLimit,
    cashOutTxLimit: cashLimit,
    cashInDailyLimit: cashLimit,
    cashOutDailyLimit: cashLimit,
    fiatCurrency: locale.fiatCurrency,
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
  const url = COIN_ATM_RADAR_URL

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

  return axios.default(config)
    .then(r => logger.info(r.status))
}

function mapRecord (rates, settings) {
  const timestamp = new Date().toISOString()
  return Promise.all([getMachines(rates, settings), getOperatorId('coinatmradar')])
    .then(([machines, operatorId]) => {
      return {
        operatorId: operatorId,
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
