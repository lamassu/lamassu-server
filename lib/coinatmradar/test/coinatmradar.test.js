const yup = require('yup')
const BN = require('../../../lib/bn')
const car = require('../coinatmradar')
const db = require('../../db')

jest.mock('../../db')

afterEach(() => {
  // https://stackoverflow.com/questions/58151010/difference-between-resetallmocks-resetmodules-resetmoduleregistry-restoreallm
  jest.restoreAllMocks()
})

const settings = {
  config: {
    wallets_BTC_coin: 'BTC',
    wallets_BTC_wallet: 'mock-wallet',
    wallets_BTC_ticker: 'kraken',
    wallets_BTC_exchange: 'mock-exchange',
    wallets_BTC_zeroConf: 'all-zero-conf',
    locale_id: '1983951f-6c73-4308-ae6e-f6f56dfa5e11',
    locale_country: 'US',
    locale_fiatCurrency: 'USD',
    locale_languages: ['en-US'],
    locale_cryptoCurrencies: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC', 'BCH'],
    commissions_minimumTx: 1,
    commissions_fixedFee: 2,
    commissions_cashOut: 11,
    commissions_cashIn: 11,
    commissions_id: '960bb192-db37-40eb-9b59-2c2c78620de6',
    wallets_ETH_active: true,
    wallets_ETH_ticker: 'bitstamp',
    wallets_ETH_wallet: 'mock-wallet',
    wallets_ETH_exchange: 'mock-exchange',
    wallets_ETH_zeroConf: 'mock-zero-conf',
    wallets_LTC_active: true,
    wallets_LTC_ticker: 'kraken',
    wallets_LTC_wallet: 'mock-wallet',
    wallets_LTC_exchange: 'mock-exchange',
    wallets_LTC_zeroConf: 'mock-zero-conf',
    wallets_DASH_active: true,
    wallets_DASH_ticker: 'coinbase',
    wallets_DASH_wallet: 'mock-wallet',
    wallets_DASH_exchange: 'mock-exchange',
    wallets_DASH_zeroConf: 'mock-zero-conf',
    wallets_ZEC_active: true,
    wallets_ZEC_ticker: 'coinbase',
    wallets_ZEC_wallet: 'mock-wallet',
    wallets_ZEC_exchange: 'mock-exchange',
    wallets_ZEC_zeroConf: 'mock-zero-conf',
    wallets_BCH_active: true,
    wallets_BCH_ticker: 'bitpay',
    wallets_BCH_wallet: 'mock-wallet',
    wallets_BCH_exchange: 'mock-exchange',
    wallets_BCH_zeroConf: 'mock-zero-conf',
    wallets_BTC_zeroConfLimit: 50,
    wallets_ETH_zeroConfLimit: 50,
    wallets_LTC_zeroConfLimit: 50,
    wallets_BCH_zeroConfLimit: 50,
    wallets_DASH_zeroConfLimit: 50,
    wallets_ZEC_zeroConfLimit: 50,
    cashOut_7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4_zeroConfLimit: 50,
    cashOut_7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4_bottom: 20,
    cashOut_7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4_top: 5,
    cashOut_7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4_active: true,
    cashOut_f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05_zeroConfLimit: 200,
    cashOut_f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05_bottom: 20,
    cashOut_f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05_top: 5,
    cashOut_f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05_active: true,
    notifications_email_active: false,
    notifications_sms_active: true,
    notifications_email_errors: false,
    notifications_sms_errors: true,
    coinAtmRadar_active: true,
    coinAtmRadar_commissions: true,
    coinAtmRadar_limitsAndVerification: true,
    triggers: [
      {
        requirement: 'suspend',
        suspensionDays: 1,
        threshold: 123,
        id: '9c3b5af8-b1d1-4125-b169-0e913b33894c',
        direction: 'both',
        triggerType: 'txAmount'
      },
      {
        requirement: 'sms',
        threshold: 999,
        thresholdDays: 1,
        id: 'b0e1e6a8-be1b-4e43-ac5f-3e4951e86f8b',
        direction: 'both',
        triggerType: 'txVelocity'
      },
      {
        requirement: 'sms',
        threshold: 888,
        thresholdDays: 1,
        id: '6ac38fe6-172c-48a4-8a7f-605213cbd600',
        direction: 'both',
        triggerType: 'txVolume'
      }
    ],
    notifications_sms_transactions: true,
    notifications_highValueTransaction: 50
  },
  accounts: {}
}

const rates = [
  {
    rates: {
      ask: new BN(19164.3),
      bid: new BN(19164.2)
    },
    timestamp: +new Date()
  },
  {
    rates: {
      ask: new BN(594.54),
      bid: new BN(594.09)
    },
    timestamp: +new Date()
  },
  {
    rates: {
      ask: new BN(84.38),
      bid: new BN(84.37)
    },
    timestamp: +new Date()
  },
  {
    rates: {
      ask: new BN(102.8),
      bid: new BN(101.64)
    },
    timestamp: +new Date()
  },
  {
    rates: {
      ask: new BN(74.91),
      bid: new BN(74.12)
    },
    timestamp: +new Date()
  },
  {
    rates: {
      ask: new BN(284.4),
      bid: new BN(284.4)
    },
    timestamp: +new Date()
  }
]

const dbResponse = [
  {
    device_id:
      'mock7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4',
    last_online: new Date('2020-11-16T13:11:03.169Z'),
    stale: false
  },
  {
    device_id:
      '9871e58aa2643ff9445cbc299b50397430ada75157d6c29b4c93548fff0f48f7',
    last_online: new Date('2020-11-16T16:21:35.948Z'),
    stale: false
  },
  {
    device_id:
      '5ae0d02dedeb77b6521bd5eb7c9159bdc025873fa0bcb6f87aaddfbda0c50913',
    last_online: new Date('2020-11-19T15:07:57.089Z'),
    stale: false
  },
  {
    device_id:
      'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    last_online: new Date('2020-11-26T20:05:57.792Z'),
    stale: false
  },
  {
    device_id:
      '490ab16ee0c124512dc769be1f3e7ee3894ce1e5b4b8b975e134fb326e551e88',
    last_online: new Date('2020-12-04T16:48:05.129Z'),
    stale: false
  }
]

function validateData(data) {
  const schema = yup.object().shape({
    operatorId: yup.string().required('operatorId not provided'),
    operator: yup.object().shape({
      name: yup.string().nullable(),
      phone: yup.string().nullable(),
      email: yup.string().email().nullable()
    }),
    timestamp: yup.string().required('timestamp not provided'),
    machines: yup.array().of(
      yup.object().shape({
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
        status: yup
          .string()
          .required('status not provided')
          .oneOf(['online', 'offline']),
        lastOnline: yup
          .string()
          .required('date in isostring format not provided'),
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
          isIdDocScan: yup
            .boolean()
            .required('isIdDocScan boolean not defined'),
          isFingerprint: yup
            .boolean()
            .required('isFingerprint boolean not defined')
        }),
        coins: yup.array().of(
          yup.object().shape({
            cryptoCode: yup.string().required('cryptoCode not provided'),
            cashInFee: yup.number().nullable(),
            cashOutFee: yup.number().nullable(),
            cashInFixedFee: yup.number().nullable(),
            cashInRate: yup.number().nullable(),
            cashOutRate: yup.number().nullable()
          })
        )
      })
    )
  })
  return schema.validate(data)
}

test('Verify axios request schema', async () => {
  const axios = require('axios')

  jest.spyOn(axios, 'default').mockImplementation(
    jest.fn(req =>
      validateData(req.data)
        .then(() => ({ status: 'mock status 200' }))
        .catch(e => fail(e))
    )
  )

  db.any.mockResolvedValue(dbResponse)
  await car.update(rates, settings)
})
