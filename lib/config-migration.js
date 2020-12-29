const _ = require('lodash/fp')
const uuid = require('uuid')
const { COINS } = require('lamassu-coins')
// const { COINS } = require('../lib/new-admin/config/coins')
const { scopedValue } = require('./admin/config-manager')

const GLOBAL = 'global'
const ALL_CRYPTOS = _.values(COINS).sort()
const ALL_CRYPTOS_STRING = 'ALL_COINS'
const ALL_MACHINES = 'ALL_MACHINES'

const GLOBAL_SCOPE = {
  crypto: ALL_CRYPTOS,
  machine: GLOBAL
}

function getConfigFields (codes, config) {
  const stringfiedGlobalScope = JSON.stringify(GLOBAL_SCOPE)

  const fields = config
    .filter(i => codes.includes(i.fieldLocator.code))
    .map(f => {
      const crypto = Array.isArray(f.fieldLocator.fieldScope.crypto)
        ? f.fieldLocator.fieldScope.crypto.sort()
        : f.fieldLocator.fieldScope.crypto === GLOBAL
          ? ALL_CRYPTOS
          : [f.fieldLocator.fieldScope.crypto]
      const machine = f.fieldLocator.fieldScope.machine

      return {
        code: f.fieldLocator.code,
        scope: {
          crypto,
          machine
        },
        value: f.fieldValue.value
      }
    })
    .filter(f => f.value != null)

  const grouped = _.chain(fields)
    .groupBy(f => JSON.stringify(f.scope))
    .value()

  return {
    global: grouped[stringfiedGlobalScope] || [],
    scoped:
      _.entries(
        _.chain(grouped)
          .omit([stringfiedGlobalScope])
          .value()
      ).map(f => {
        const fallbackValues =
          _.difference(codes, f[1].map(v => v.code))
            .map(v => ({
              code: v,
              scope: JSON.parse(f[0]),
              value: scopedValue(f[0].crypto, f[0].machine, v, config)
            }))
            .filter(f => f.value != null)

        return {
          scope: JSON.parse(f[0]),
          values: f[1].concat(fallbackValues)
        }
      }) || []
  }
}

function migrateCommissions (config) {
  const areArraysEquals = (arr1, arr2) => Array.isArray(arr1) && Array.isArray(arr2) && _.isEmpty(_.xor(arr1, arr2))
  const getMachine = _.get('scope.machine')
  const getCrypto = _.get('scope.crypto')
  const flattenCoins = _.compose(_.flatten, _.map(getCrypto))
  const diffAllCryptos = _.compose(_.difference(ALL_CRYPTOS))

  const codes = {
    minimumTx: 'minimumTx',
    cashInFee: 'fixedFee',
    cashInCommission: 'cashIn',
    cashOutCommission: 'cashOut'
  }

  const { global, scoped } = getConfigFields(_.keys(codes), config)

  const machineAndCryptoScoped = scoped.filter(
    f => f.scope.machine !== GLOBAL_SCOPE.machine && f.scope.crypto.length === 1
  )
  const cryptoScoped = scoped.filter(
    f =>
      f.scope.machine === GLOBAL_SCOPE.machine &&
      !areArraysEquals(f.scope.crypto, GLOBAL_SCOPE.crypto)
  )
  const machineScoped = scoped.filter(
    f =>
      f.scope.machine !== GLOBAL_SCOPE.machine &&
      areArraysEquals(f.scope.crypto, GLOBAL_SCOPE.crypto)
  )

  const withCryptoScoped = machineAndCryptoScoped.concat(cryptoScoped)

  const filteredMachineScoped = _.map(it => {
    const filterByMachine = _.filter(_.includes(getMachine(it)))
    const unrepeatedCryptos = _.compose(
      diffAllCryptos,
      flattenCoins,
      filterByMachine
    )(withCryptoScoped)

    return _.set('scope.crypto', unrepeatedCryptos)(it)
  })(machineScoped)

  const allCommissionsOverrides = withCryptoScoped.concat(filteredMachineScoped)

  return {
    ..._.fromPairs(global.map(f => [`commissions_${codes[f.code]}`, f.value])),
    ...(allCommissionsOverrides.length > 0 && {
      commissions_overrides: allCommissionsOverrides.map(s => ({
        ..._.fromPairs(s.values.map(f => [codes[f.code], f.value])),
        machine: s.scope.machine === GLOBAL ? ALL_MACHINES : s.scope.machine,
        cryptoCurrencies: areArraysEquals(s.scope.crypto, ALL_CRYPTOS) ? [ALL_CRYPTOS_STRING] : s.scope.crypto,
        id: uuid.v4()
      }))
    })
  }
}

function migrateLocales (config) {
  const codes = {
    country: 'country',
    fiatCurrency: 'fiatCurrency',
    machineLanguages: 'languages',
    cryptoCurrencies: 'cryptoCurrencies',
    timezone: 'timezone'
  }

  const { global, scoped } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`locale_${codes[f.code]}`, f.value])),
    ...(scoped.length > 0 && {
      locale_overrides: scoped.map(s => ({
        ..._.fromPairs(s.values.map(f => [codes[f.code], f.value])),
        machine: s.scope.machine,
        id: uuid.v4()
      }))
    })
  }
}

function migrateCashOut (config) {
  const globalCodes = {
    fudgeFactorActive: 'fudgeFactorActive'
  }

  const scopedCodes = {
    cashOutEnabled: 'active',
    topCashOutDenomination: 'top',
    bottomCashOutDenomination: 'bottom',
    zeroConfLimit: 'zeroConfLimit'
  }

  const { global } = getConfigFields(_.keys(globalCodes), config)
  const { scoped } = getConfigFields(_.keys(scopedCodes), config)

  return {
    ..._.fromPairs(
      global.map(f => [`cashOut_${globalCodes[f.code]}`, f.value])
    ),
    ..._.fromPairs(
      _.flatten(
        scoped.map(s => {
          const fields = s.values.map(f => [
            `cashOut_${f.scope.machine}_${scopedCodes[f.code]}`,
            f.value
          ])

          fields.push([`cashOut_${s.scope.machine}_id`, s.scope.machine])

          return fields
        })
      )
    )
  }
}

function migrateNotifications (config) {
  const globalCodes = {
    notificationsEmailEnabled: 'email_active',
    notificationsSMSEnabled: 'sms_active',
    cashOutCassette1AlertThreshold: 'fiatBalanceCassette1',
    cashOutCassette2AlertThreshold: 'fiatBalanceCassette2',
    cryptoAlertThreshold: 'cryptoLowBalance'
  }

  const machineScopedCodes = {
    cashOutCassette1AlertThreshold: 'cassette1',
    cashOutCassette2AlertThreshold: 'cassette2'
  }

  const cryptoScopedCodes = {
    cryptoAlertThreshold: 'lowBalance'
  }

  const { global } = getConfigFields(_.keys(globalCodes), config)
  const machineScoped = getConfigFields(
    _.keys(machineScopedCodes),
    config
  ).scoped.filter(f => f.scope.crypto === GLOBAL && f.scope.machine !== GLOBAL)
  const cryptoScoped = getConfigFields(
    _.keys(cryptoScopedCodes),
    config
  ).scoped.filter(f => f.scope.crypto !== GLOBAL && f.scope.machine === GLOBAL)

  return {
    ..._.fromPairs(
      global.map(f => [`notifications_${globalCodes[f.code]}`, f.value])
    ),
    notifications_email_balance: true,
    notifications_email_transactions: true,
    notifications_email_compliance: true,
    notifications_email_errors: true,
    notifications_sms_balance: true,
    notifications_sms_transactions: true,
    notifications_sms_compliance: true,
    notifications_sms_errors: true,
    ...(machineScoped.length > 0 && {
      notifications_fiatBalanceOverrides: machineScoped.map(s => ({
        ..._.fromPairs(
          s.values.map(f => [machineScopedCodes[f.code], f.value])
        ),
        machine: s.scope.machine,
        id: uuid.v4()
      }))
    }),
    ...(cryptoScoped.length > 0 && {
      notifications_cryptoBalanceOverrides: cryptoScoped.map(s => ({
        ..._.fromPairs(s.values.map(f => [cryptoScopedCodes[f.code], f.value])),
        cryptoCurrency: s.scope.crypto,
        id: uuid.v4()
      }))
    })
  }
}

function migrateWallet (config) {
  const codes = {
    ticker: 'ticker',
    wallet: 'wallet',
    exchange: 'exchange',
    zeroConf: 'zeroConf'
  }

  const { scoped } = getConfigFields(_.keys(codes), config)

  return {
    ...(scoped.length > 0 &&
      _.fromPairs(
        _.flatten(
          scoped.map(s =>
            s.values.map(f => [
              `wallets_${f.scope.crypto}_${codes[f.code]}`,
              f.value
            ])
          )
        )
      ))
  }
}

function migrateOperatorInfo (config) {
  const codes = {
    operatorInfoActive: 'active',
    operatorInfoEmail: 'email',
    operatorInfoName: 'name',
    operatorInfoPhone: 'phone',
    operatorInfoWebsite: 'website',
    operatorInfoCompanyNumber: 'companyNumber'
  }

  const { global } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`operatorInfo_${codes[f.code]}`, f.value]))
  }
}

function migrateReceiptPrinting (config) {
  const codes = {
    receiptPrintingActive: 'active'
  }

  const { global } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`receipt_${codes[f.code]}`, f.value])),
    receipt_operatorWebsite: true,
    receipt_operatorEmail: true,
    receipt_operatorPhone: true,
    receipt_companyRegistration: true,
    receipt_machineLocation: true,
    receipt_customerNameOrPhoneNumber: true,
    receipt_exchangeRate: true,
    receipt_addressQRCode: true
  }
}

function migrateCoinATMRadar (config) {
  const codes = ['coinAtmRadarActive', 'coinAtmRadarShowRates']

  const { global } = getConfigFields(codes, config)
  const coinAtmRadar = _.fromPairs(global.map(f => [f.code, f.value]))

  return {
    coinAtmRadar_active: coinAtmRadar.coinAtmRadarActive,
    coinAtmRadar_commissions: coinAtmRadar.coinAtmRadarShowRates,
    coinAtmRadar_limitsAndVerification: coinAtmRadar.coinAtmRadarShowRates
  }
}

function migrateTermsAndConditions (config) {
  const codes = {
    termsScreenActive: 'active',
    termsScreenTitle: 'title',
    termsScreenText: 'text',
    termsAcceptButtonText: 'acceptButtonText',
    termsCancelButtonText: 'cancelButtonText'
  }

  const { global } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(
      global.map(f => [`termsConditions_${codes[f.code]}`, f.value])
    )
  }
}

function migrateComplianceTriggers (config) {

  const suspensionDays = 1

  const triggerTypes = {
    amount: 'txAmount',
    velocity: 'txVelocity',
    volume: 'txVolume',
    consecutiveDays: 'consecutiveDays'
  }

  const requirements = {
    sms: 'sms',
    idData: 'idCardData',
    idPhoto: 'idCardPhoto',
    facePhoto: 'facephoto',
    sanctions: 'sanctions',
    suspend: 'suspend'
  }

  function createTrigger (
    requirement,
    threshold,
    suspensionDays
  ) {
    const triggerConfig = {
      id: uuid.v4(),
      direction: 'both',
      threshold,
      thresholdDays: 1,
      triggerType: triggerTypes.volume,
      requirement
    }
    if (!requirement === 'suspend') return triggerConfig
    return _.assign(triggerConfig, { suspensionDays })
  }

  const codes = [
    'smsVerificationActive',
    'smsVerificationThreshold',
    'idCardDataVerificationActive',
    'idCardDataVerificationThreshold',
    'idCardPhotoVerificationActive',
    'idCardPhotoVerificationThreshold',
    'frontCameraVerificationActive',
    'frontCameraVerificationThreshold',
    'sanctionsVerificationActive',
    'sanctionsVerificationThreshold',
    'hardLimitVerificationActive',
    'hardLimitVerificationThreshold',
    'rejectAddressReuseActive'
  ]

  const global = _.fromPairs(
    getConfigFields(codes, config).global.map(f => [f.code, f.value])
  )

  const triggers = []
  if (global.smsVerificationActive && _.isNumber(global.smsVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.sms, global.smsVerificationThreshold)
    )
  }
  if (global.idCardDataVerificationActive && _.isNumber(global.idCardDataVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.idData, global.idCardDataVerificationThreshold)
    )
  }
  if (global.idCardPhotoVerificationActive && _.isNumber(global.idCardPhotoVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.idPhoto, global.idCardPhotoVerificationThreshold)
    )
  }
  if (global.frontCameraVerificationActive && _.isNumber(global.frontCameraVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.facePhoto, global.frontCameraVerificationThreshold)
    )
  }
  if (global.sanctionsVerificationActive && _.isNumber(global.sanctionsVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.sanctions, global.sanctionsVerificationThreshold)
    )
  }
  if (global.hardLimitVerificationActive && _.isNumber(global.hardLimitVerificationThreshold)) {
    triggers.push(
      createTrigger(requirements.suspend, global.hardLimitVerificationThreshold, suspensionDays)
    )
  }
  return {
    triggers,
    ['compliance_rejectAddressReuse']: global.rejectAddressReuseActive
  }
}

function migrateConfig (config) {
  return {
    ...migrateCommissions(config),
    ...migrateLocales(config),
    ...migrateCashOut(config),
    ...migrateNotifications(config),
    ...migrateWallet(config),
    ...migrateOperatorInfo(config),
    ...migrateReceiptPrinting(config),
    ...migrateCoinATMRadar(config),
    ...migrateTermsAndConditions(config),
    ...migrateComplianceTriggers(config)
  }
}

function migrateAccounts (accounts) {
  const accountArray = [
    'bitgo',
    'bitstamp',
    'blockcypher',
    'infura',
    'itbit',
    'kraken',
    'mailgun',
    'twilio'
  ]

  const services = _.keyBy('code', accounts)
  const serviceFields = _.mapValues(({ fields }) => _.keyBy('code', fields))(services)
  const allAccounts = _.mapValues(_.mapValues(_.get('value')))(serviceFields)
  return _.pick(accountArray)(allAccounts)
}

function migrate (config, accounts) {
  return {
    config: migrateConfig(config),
    accounts: migrateAccounts(accounts)
  }
}

module.exports = {
  migrateConfig,
  migrateAccounts,
  migrate
}
