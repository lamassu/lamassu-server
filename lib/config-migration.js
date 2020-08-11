const _ = require('lodash/fp')
const uuid = require('uuid')
const { COINS } = require('../lib/new-admin/config/coins')

const GLOBAL = 'global'
const ALL_CRYPTOS = _.values(COINS).sort()
const ALL_MACHINES = 'all machines'

const GLOBAL_SCOPE = {
  crypto: ALL_CRYPTOS,
  machine: GLOBAL
}

function getConfigFields(codes, config) {
  const stringfiedGlobalScope = JSON.stringify(GLOBAL_SCOPE)

  const fields = 
    config
      .filter(i => codes.includes(i.fieldLocator.code))
      .map(f => {
        const crypto = Array.isArray(f.fieldLocator.fieldScope.crypto) ?
          f.fieldLocator.fieldScope.crypto.sort() :
          f.fieldLocator.fieldScope.crypto === GLOBAL ?
          ALL_CRYPTOS :
          [ f.fieldLocator.fieldScope.crypto ]
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
  
  const grouped = _.chain(fields).groupBy(f => JSON.stringify(f.scope)).value()

  return {
    global: grouped[stringfiedGlobalScope] || [],
    scoped: _.entries(_.chain(grouped).omit([stringfiedGlobalScope]).value())
      .map(f => ({
        scope: JSON.parse(f[0]), 
        values: f[1]
      })) || []
  }
}

function migrateCommissions(config) {
  function areArraysEquals(arr1, arr2) {
    return _.xor(arr1, arr2).length === 0
  }

  function getAllMachines(config) {
    return _.uniq(config.map(f => f.fieldLocator.fieldScope.machine).filter(m => m !== GLOBAL))
  }

  const codes = {
    minimumTx: 'minimumTx',
    cashInFee: 'fixedFee',
    cashInCommission: 'cashIn',
    cashOutCommission: 'cashOut'
  }

  const { global, scoped } = getConfigFields(_.keys(codes), config)
  const allMachines = getAllMachines(config).sort()

  const machineAndCryptoScoped = 
    scoped.filter(f => f.scope.machine !== GLOBAL_SCOPE.machine && f.scope.crypto.length === 1)
  const cryptoScoped =
    scoped.filter(f => f.scope.machine === GLOBAL_SCOPE.machine && !areArraysEquals(f.scope.crypto, GLOBAL_SCOPE.crypto))
  const machineScoped = 
    scoped.filter(f => f.scope.machine !== GLOBAL_SCOPE.machine && areArraysEquals(f.scope.crypto, GLOBAL_SCOPE.crypto))

  let machineAndCryptoScopedPlusCryptoScopedCommissionsOverrides = 
    machineAndCryptoScoped.concat(cryptoScoped)

  let allCommissionsOverrides =
    machineAndCryptoScopedPlusCryptoScopedCommissionsOverrides
      .concat(machineScoped.map(f => {
        const cryptosAlreadyScopedWithThisFieldMachine = _.flatten(
          machineAndCryptoScopedPlusCryptoScopedCommissionsOverrides
            .filter(innerF => innerF.scope.machine.includes(f.scope.machine))
            .map(innerF => innerF.scope.crypto)
        )
        
        f.scope.crypto = _.difference(
          ALL_CRYPTOS,
          cryptosAlreadyScopedWithThisFieldMachine
        )

        return f
      }))

  return {
    ..._.fromPairs(global.map(f => [`commissions_${codes[f.code]}`, f.value])),
    ...(allCommissionsOverrides.length > 0 && {
      commissions_overrides: allCommissionsOverrides.map(s => ({
        ..._.fromPairs(s.values.map(f => [codes[f.code], f.value])),
        machine: s.scope.machine === GLOBAL ? ALL_MACHINES : s.scope.machine,
        cryptoCurrencies: s.scope.crypto,
        id: uuid.v4()
      }))
    })
  }
}

function migrateLocales(config) {
  const codes = {
    country: 'country',
    fiatCurrency: 'fiatCurrency',
    machineLanguages :'languages',
    cryptoCurrencies: 'cryptoCurrencies'
  }

  const { global, scoped } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`locale_${codes[f.code]}`, f.value])),
    ...(scoped.length > 0 && {
      locale_overrides:
        scoped.map(s => ({
          ..._.fromPairs(s.values.map(f => [codes[f.code], f.value])),
          machine: s.scope.machine,
          id: uuid.v4()
        }))
    })
  }
}

// TODO new-admin: virtualCashOutDenomination
function migrateCashOut(config) {
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
    ..._.fromPairs(global.map(f => [`cashout_${globalCodes[f.code]}`, f.value])),
    ..._.fromPairs(_.flatten(
      scoped.map(s => {
        let fields = s.values.map(f => [
          `cashout_${f.scope.machine}_${scopedCodes[f.code]}`,
          f.value
        ])
      
        fields.push([
          `cashout_${s.scope.machine}_id`,
          s.scope.machine
        ])

        return fields
      })
    ))
  }
}

function migrateNotifications(config) {
  const globalCodes = {
    notificationsEmailEnabled: 'email_active',
    notificationsSMSEnabled: 'sms_active',
    cashOutCassette1AlertThreshold: 'fiatBalanceCassette1',
    cashOutCassette2AlertThreshold: 'fiatBalanceCassette2',
    cryptoAlertThreshold : 'cryptoLowBalance'
  }

  const machineScopedCodes = {
    cashOutCassette1AlertThreshold: 'cassette1',
    cashOutCassette2AlertThreshold: 'cassette2'
  }

  const cryptoScopedCodes = {
    cryptoAlertThreshold : 'lowBalance'
  }

  const { global } = getConfigFields(_.keys(globalCodes), config)
  const machineScoped = getConfigFields(_.keys(machineScopedCodes), config).scoped
    .filter(f => f.scope.crypto === GLOBAL && f.scope.machine !== GLOBAL)
  const cryptoScoped = getConfigFields(_.keys(cryptoScopedCodes), config).scoped
    .filter(f => f.scope.crypto !== GLOBAL && f.scope.machine === GLOBAL)

  return {
    ..._.fromPairs(global.map(f => [`notifications_${globalCodes[f.code]}`, f.value])),
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
        ..._.fromPairs(s.values.map(f => [machineScopedCodes[f.code], f.value])),
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

function migrateWallet(config) {
  const codes = {
    ticker: 'ticker',
    wallet: 'wallet',
    exchange: 'exchange',
    zeroConf: 'zeroConf'
  }

  const { scoped } = getConfigFields(_.keys(codes), config)

  return {
    ...(scoped.length > 0 && 
      _.fromPairs(_.flatten(
        scoped.map(s => s.values.map(f => [
              `wallets_${f.scope.crypto}_${codes[f.code]}`,
              f.value
            ])
          )
      ))
    )
  }
}

function migrateOperatorInfo(config) {
  const codes = {
    operatorInfoActive: 'active',
    operatorInfoEmail: 'email',
    operatorInfoName: 'name',
    operatorInfoPhone: 'phone',
    operatorInfoWebsite: 'website',
    operatorInfoCompanyNumber: 'companyNumber',
  }

  const { global } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`operatorInfo_${codes[f.code]}`, f.value])),
  }
}

function migrateReceiptPrinting(config) {
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

function migrateCoinATMRadar(config) {
  const codes = [
    'coinAtmRadarActive',
    'coinAtmRadarShowRates',
  ]

  const { global } = getConfigFields(codes, config)
  const coinAtmRadar = _.fromPairs(global.map(f => [f.code, f.value]))
  
  return {
    coinAtmRadar_active: coinAtmRadar.coinAtmRadarActive,
    coinAtmRadar_commissions: coinAtmRadar.coinAtmRadarShowRates,
    coinAtmRadar_limitsAndVerification: coinAtmRadar.coinAtmRadarShowRates
  }
}

function migrateTermsAndConditions(config) {
  const codes = {
    termsScreenActive: 'active',
    termsScreenTitle: 'title',
    termsScreenText: 'text',
    termsAcceptButtonText: 'acceptButtonText',
    termsCancelButtonText: 'cancelButtonText',
  }

  const { global } = getConfigFields(_.keys(codes), config)

  return {
    ..._.fromPairs(global.map(f => [`termsConditions_${codes[f.code]}`, f.value])),
  }
}

// TODO new-admin: rejectAddressReuseActive
function migrateComplianceTriggers(config) {
  const triggerTypes = {
    amount: 'txAmount',
    velocity: 'txVelocity',
    volume: 'txVolume',
    consecutiveDays: 'consecutiveDays'
  }

  const requirements = {
    sms: 'sms',
    idData: 'idData',
    idPhoto: 'idPhoto',
    facePhoto: 'facePhoto',
    sanctions: 'sanctions'
  }

  function createTrigger(
    requirement,
    threshold,
    thresholdDays = 1,
    triggerType = triggerTypes.volume,
    id = uuid.v4(),
    cashDirection = 'both') {
    return {
      id,
      cashDirection,
      threshold,
      thresholdDays,
      triggerType,
      requirement
    }
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
    'sanctionsVerificationThreshold'
  ]

  const global = _.fromPairs(getConfigFields(codes, config).global.map(f => [f.code, f.value]))
  
  let triggers = []
  if (global.smsVerificationActive) triggers.push(createTrigger(requirements.sms, global.smsVerificationThreshold))
  if (global.idCardDataVerificationActive) triggers.push(createTrigger(requirements.idData, global.smsVerificationThreshold))
  if (global.idCardPhotoVerificationActive) triggers.push(createTrigger(requirements.idPhoto, global.smsVerificationThreshold))
  if (global.frontCameraVerificationActive) triggers.push(createTrigger(requirements.facePhoto, global.smsVerificationThreshold))
  if (global.sanctionsVerificationActive) triggers.push(createTrigger(requirements.sanctions, global.smsVerificationThreshold))

  return {
    triggers
  }
}

function migrateConfig(config) {
  return {
    config: {
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
}

function migrateAccounts(accounts) {
  function renameAccountFields(account, replacements) {
    return _.fromPairs(
      _.toPairs(account)
        .map(p => [
          replacements[p[0]],
          p[1]
        ])
    )
  }

  const bitgoFields = {
    BCHWalletId: 'bchWalletId',
    BCHWalletPassphrase: 'bchWalletPassphrase',
    BTCWalletId: 'btcWalletId',
    BTCWalletPassphrase: 'btcWalletPassphrase',
    DASHWalletId: 'dashWalletId',
    DASHWalletPassphrase: 'dashWalletPassphrase',
    environment: 'environment',
    LTCWalletId: 'ltcWalletId',
    LTCWalletPassphrase: 'ltcWalletPassphrase',
    token: 'token',
    ZECWalletId: 'zecWalletId',
    ZECWalletPassphrase: 'zecWalletPassphrase'
  }

  let accountsProps = []
  if (accounts.bitgo) accountsProps.push(['bitgo', renameAccountFields(accounts.bitgo, bitgoFields)])
  if (accounts.bitstamp) accountsProps.push(['bitstamp', accounts.bitstamp])
  if (accounts.blockcypher) accountsProps.push(['blockcypher', accounts.blockcypher])
  if (accounts.infura) accountsProps.push(['infura', accounts.infura])
  if (accounts.itbit) accountsProps.push(['itbit', accounts.itbit])
  if (accounts.kraken) accountsProps.push(['kraken', accounts.kraken])
  if (accounts.mailgun) accountsProps.push(['mailgun', accounts.mailgun])
  if (accounts.twilio) accountsProps.push(['twilio', accounts.twilio])

  return {
    accounts: _.fromPairs(accountsProps)
  }
}

function migrate(config, accounts) {
  return {
    ...migrateConfig(config),
    ...migrateAccounts(accounts)
  }
}

module.exports = {
  migrateConfig,
  migrateAccounts,
  migrate
}
