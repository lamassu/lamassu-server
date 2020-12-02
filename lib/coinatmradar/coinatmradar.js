const axios = require('axios')
const _ = require('lodash/fp')
const hkdf = require('futoin-hkdf')
const yup = require("yup")

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
  const cashLimit = showLimitsAndVerification ? ( complianceTriggers.getCashLimit(triggers)?.threshold || Infinity ) : null
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

function validateData (data) {
  const schema = yup.object().shape({
    operatorId: yup.string().required('operatorId not provided'),
    operator: yup.object().shape({
      name: yup.string().nullable(),
      phone: yup.string().nullable(),
      email: yup.string().email().nullable()
    }),
    timestamp: yup.string().required('timestamp not provided'),
    machines: yup.array().of(yup.object().shape({
      machineId: yup.string().required('machineId not provided'),
      address: yup.object().required('address object not provided').shape({
        streetAddress: yup.string().nullable(),
        city: yup.string().nullable(),
        region: yup.string().nullable(),
        postalCode: yup.string().nullable(),
        country: yup.string().nullable()
      }),
      location: yup.object().required('location object not provided').shape({
        name: yup.string().nullable(),
        url: yup.string().nullable(),
        phone: yup.string().nullable()
      }),
      status: yup.string().required('status not provided').oneOf(['online', 'offline']),
      lastOnline: yup.string().required('date in isostring format not provided'),
      cashIn: yup.boolean().required('cashIn boolean not defined'),
      cashOut: yup.boolean().required('cashOut boolean not defined'),
      manufacturer: yup.string().required('manufacturer not provided'),
      cashInTxLimit: yup.number().nullable(),
      cashOutTxLimit: yup.number().nullable(),
      cashInDailyLimit: yup.number().nullable(),
      cashOutDailyLimit: yup.number().nullable(),
      fiatCurrency: yup.string().required('fiatCurrency not provided'),
      identification: yup.object().shape({
        isPhone: yup.boolean().required('isPhone boolean not defined'),
        isPalmVein: yup.boolean().required('isPalmVein boolean not defined'),
        isPhoto: yup.boolean().required('isPhoto boolean not defined'),
        isIdDocScan: yup.boolean().required('isIdDocScan boolean not defined'),
        isFingerprint: yup.boolean().required('isFingerprint boolean not defined')
      }),
      coins: yup.array().of(yup.object().shape({
        cryptoCode: yup.string().required('cryptoCode not provided'),
        cashInFee: yup.number().nullable(),
        cashOutFee: yup.number().nullable(),
        cashInFixedFee: yup.number().nullable(),
        cashInRate: yup.number().nullable(),
        cashOutRate: yup.number().nullable(),
      }))
    }))
  })

  return schema.validate(data)
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

  return validateData(data)
    .then(() => axios(config))
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
