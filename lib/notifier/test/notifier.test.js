const BigNumber = require('../../../lib/bn')

const notifier = require('..')
const utils = require('../utils')
const queries = require("../queries")
const emailFuncs = require('../email')
const smsFuncs = require('../sms')

afterEach(() => {
  // https://stackoverflow.com/questions/58151010/difference-between-resetallmocks-resetmodules-resetmoduleregistry-restoreallm
  jest.restoreAllMocks()
})

// mock plugins object with mock data to test functions
const plugins = {
  sendMessage: rec => {
    return rec
  },
  getNotificationConfig: () => ({
    email_active: false,
    sms_active: true,
    email_errors: false,
    sms_errors: true,
    sms: { active: true, errors: true },
    email: { active: false, errors: false }
  }),
  getMachineNames: () => [
    {
      deviceId:
        'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
      cashbox: 0,
      cassette1: 444,
      cassette2: 222,
      version: '7.5.0-beta.0',
      model: 'unknown',
      pairedAt: '2020-11-13T16:20:31.624Z',
      lastPing: '2020-11-16T13:11:03.169Z',
      name: 'Abc123',
      paired: true,
      cashOut: true,
      statuses: [{ label: 'Unresponsive', type: 'error' }]
    }
  ],
  checkBalances: () => []
}

const tx = {
  id: 'bec8d452-9ea2-4846-841b-55a9df8bbd00',
  deviceId:
    '490ab16ee0c124512dc769be1f3e7ee3894ce1e5b4b8b975e134fb326e551e88',
  toAddress: 'bc1q7s4yy5n9vp6zhlf6mrw3cttdgx5l3ysr2mhc4v',
  cryptoAtoms: BigNumber(252100),
  cryptoCode: 'BTC',
  fiat: BigNumber(55),
  fiatCode: 'USD',
  fee: null,
  txHash: null,
  phone: null,
  error: null,
  created: '2020-12-04T16:28:11.016Z',
  send: true,
  sendConfirmed: false,
  timedout: false,
  sendTime: null,
  errorCode: null,
  operatorCompleted: false,
  sendPending: true,
  cashInFee: BigNumber(2),
  cashInFeeCrypto: BigNumber(9500),
  minimumTx: 5,
  customerId: '47ac1184-8102-11e7-9079-8f13a7117867',
  txVersion: 6,
  termsAccepted: false,
  commissionPercentage: BigNumber(0.11),
  rawTickerPrice: BigNumber(18937.4),
  isPaperWallet: false,
  direction: 'cashIn'
}

const notifSettings = {
  email_active: false,
  sms_active: true,
  email_errors: false,
  sms_errors: true,
  sms_transactions: true,
  highValueTransaction: Infinity, //this will make highValueTx always false
  sms: {
    active: true,
    errors: true,
    transactions: false // force early return 
  },
  email: {
    active: false,
    errors: false,
    transactions: false // force early return 
  }
}

test('Exits checkNotifications with Promise.resolve() if SMS and Email are disabled', async () => {
  expect.assertions(1)
  await expect(
    notifier.checkNotification({
      getNotificationConfig: () => ({
        sms: { active: false, errors: false },
        email: { active: false, errors: false }
      })
    })
  ).resolves.toBe(undefined)
})

test('Exits checkNotifications with Promise.resolve() if SMS and Email are disabled even if errors or balance are defined to something', async () => {
  expect.assertions(1)
  await expect(
    notifier.checkNotification({
      getNotificationConfig: () => ({
        sms: { active: false, errors: true, balance: true },
        email: { active: false, errors: true, balance: true }
      })
    })
  ).resolves.toBe(undefined)
})

test("Check Pings should return code PING for devices that haven't been pinged recently", () => {
  expect(
    notifier.checkPings([
      {
        deviceId:
          '7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4',
        lastPing: '2020-11-16T13:11:03.169Z',
        name: 'Abc123'
      }
    ])
  ).toMatchObject({
    '7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4': [
      { code: 'PING', machineName: 'Abc123' }
    ]
  })
})

test('Checkpings returns empty array as the value for the id prop, if the lastPing is more recent than 60 seconds', () => {
  expect(
    notifier.checkPings([
      {
        deviceId:
          '7a531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4',
        lastPing: new Date(),
        name: 'Abc123'
      }
    ])
  ).toMatchObject({
    '7a531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4': []
  })
})


test('Check notification resolves to undefined if shouldNotAlert is called and is true', async () => {
  const mockShouldNotAlert = jest.spyOn(utils, 'shouldNotAlert')
  mockShouldNotAlert.mockReturnValue(true)

  const result = await notifier.checkNotification(plugins)
  expect(mockShouldNotAlert).toHaveBeenCalledTimes(1)
  expect(result).toBe(undefined)
})

test('Sendmessage is called if shouldNotAlert is called and is false', async () => {
  const mockShouldNotAlert = jest.spyOn(utils, 'shouldNotAlert')
  const mockSendMessage = jest.spyOn(plugins, 'sendMessage')

  mockShouldNotAlert.mockReturnValue(false)
  const result = await notifier.checkNotification(plugins)

  expect(mockShouldNotAlert).toHaveBeenCalledTimes(1)
  expect(mockSendMessage).toHaveBeenCalledTimes(1)
  expect(result).toBe(undefined)
})

test('If no alert fingerprint and inAlert is true, exits on call to sendNoAlerts', async () => {
  // mock utils.buildAlertFingerprint to return null
  // mock utils.getAlertFingerprint to be true which will make inAlert true

  const buildFp = jest.spyOn(utils, 'buildAlertFingerprint')
  const mockGetFp = jest.spyOn(utils, 'getAlertFingerprint')
  const mockSendNoAlerts = jest.spyOn(utils, 'sendNoAlerts')

  buildFp.mockReturnValue(null)
  mockGetFp.mockReturnValue(true)
  await notifier.checkNotification(plugins)

  expect(mockGetFp).toHaveBeenCalledTimes(1)
  expect(mockSendNoAlerts).toHaveBeenCalledTimes(1)
})

// vvv tests for checkstuckscreen...
test('checkStuckScreen returns [] when no events are found', () => {
  expect(notifier.checkStuckScreen([], 'Abc123')).toEqual([])
})

test('checkStuckScreen returns [] if most recent event is idle', () => {
  // device_time is what matters for the sorting of the events by recency
  expect(
    notifier.checkStuckScreen([
      {
        id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
        device_id:
          'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
        event_type: 'stateChange',
        note: '{"state":"chooseCoin","isIdle":false}',
        created: '2020-11-23T19:30:29.209Z',
        device_time: '1999-11-23T19:30:29.177Z',
        age: 157352628.123
      },
      {
        id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
        device_id:
          'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
        event_type: 'stateChange',
        note: '{"state":"chooseCoin","isIdle":true}',
        created: '2020-11-23T19:30:29.209Z',
        device_time: '2020-11-23T19:30:29.177Z',
        age: 157352628.123
      }
    ])
  ).toEqual([])
})

test('checkStuckScreen returns object array of length 1 with prop code: "STALE" if age > STALE_STATE', () => {
  // there is an age 0 and an isIdle true in the first object but it will be below the second one in the sorting order and thus ignored
  const result = notifier.checkStuckScreen([
    {
      id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
      device_id:
        'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
      event_type: 'stateChange',
      note: '{"state":"chooseCoin","isIdle":true}',
      created: '2020-11-23T19:30:29.209Z',
      device_time: '1999-11-23T19:30:29.177Z',
      age: 0
    },
    {
      id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
      device_id:
        'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
      event_type: 'stateChange',
      note: '{"state":"chooseCoin","isIdle":false}',
      created: '2020-11-23T19:30:29.209Z',
      device_time: '2020-11-23T19:30:29.177Z',
      age: 157352628.123
    }
  ])
  expect(result[0]).toMatchObject({ code: 'STALE' })
})

test('checkStuckScreen returns empty array if age < STALE_STATE', () => {
  const STALE_STATE = require('../codes').STALE_STATE
  const result1 = notifier.checkStuckScreen([
    {
      id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
      device_id:
        'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
      event_type: 'stateChange',
      note: '{"state":"chooseCoin","isIdle":false}',
      created: '2020-11-23T19:30:29.209Z',
      device_time: '2020-11-23T19:30:29.177Z',
      age: 0
    }
  ])
  const result2 = notifier.checkStuckScreen([
    {
      id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
      device_id:
        'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
      event_type: 'stateChange',
      note: '{"state":"chooseCoin","isIdle":false}',
      created: '2020-11-23T19:30:29.209Z',
      device_time: '2020-11-23T19:30:29.177Z',
      age: STALE_STATE
    }
  ])
  expect(result1).toEqual([])
  expect(result2).toEqual([])
})

test("calls sendRedemptionMessage if !zeroConf and rec.isRedemption", async () => {
  const configManager = require('../../new-config-manager')
  const settingsLoader = require('../../new-settings-loader')

  const loadLatest = jest.spyOn(settingsLoader, 'loadLatest') 
  const getGlobalNotifications = jest.spyOn(configManager, 'getGlobalNotifications')
  const getCashOut = jest.spyOn(configManager, 'getCashOut')

  // sendRedemptionMessage will cause this func to be called
  jest.spyOn(smsFuncs, 'sendMessage').mockImplementation((_, rec) => rec)

<<<<<<< HEAD
  getCashOut.mockReturnValue({zeroConfLimit: -Infinity})
  loadLatest.mockReturnValue({})
  getGlobalNotifications.mockReturnValue({... notifSettings, sms: { active: true, errors: true, transactions: true }})
=======
  getCashOut.mockReturnValue({ zeroConfLimit: -Infinity })
  loadLatest.mockReturnValue(Promise.resolve({}))
  getGlobalNotifications.mockReturnValue({ ...notifSettings, sms: { active: true, errors: true, transactions: true }, notificationCenter: { active: true }  })
>>>>>>> a7a9fd3... Feat: move notif center fns to own file on the notifier module

  const response = await notifier.transactionNotify(tx, {isRedemption: true})
  
  // this type of response implies sendRedemptionMessage was called
  expect(response[0]).toMatchObject({
    sms: {
      body: "Here's an update on transaction bec8d452-9ea2-4846-841b-55a9df8bbd00 - It was just dispensed successfully"
    },
    email: {
      subject: "Here's an update on transaction bec8d452-9ea2-4846-841b-55a9df8bbd00",
      body: 'It was just dispensed successfully'
    }
  })
})

test("calls sendTransactionMessage if !zeroConf and !rec.isRedemption", async () => {
  const configManager = require('../../new-config-manager')
  const settingsLoader = require('../../new-settings-loader')
  const machineLoader = require('../../machine-loader')

  const loadLatest = jest.spyOn(settingsLoader, 'loadLatest') 
  const getGlobalNotifications = jest.spyOn(configManager, 'getGlobalNotifications')
  const getCashOut = jest.spyOn(configManager, 'getCashOut')
  const getMachineName = jest.spyOn(machineLoader, 'getMachineName')
  const buildTransactionMessage = jest.spyOn(utils, 'buildTransactionMessage')

  // sendMessage on emailFuncs isn't called because it is disabled in getGlobalNotifications.mockReturnValue
  jest.spyOn(smsFuncs, 'sendMessage').mockImplementation((_, rec) => ({prop: rec}))
  buildTransactionMessage.mockImplementation(() => ["mock message", false])

  getMachineName.mockReturnValue('mockMachineName')
  getCashOut.mockReturnValue({ zeroConfLimit: -Infinity })
  loadLatest.mockReturnValue(Promise.resolve({}))
  getGlobalNotifications.mockReturnValue({ ...notifSettings, sms: { active: true, errors: true, transactions: true }, notificationCenter: { active: true } })

  const response = await notifier.transactionNotify(tx, {isRedemption: false})

  // If the return object is this, it means the code went through all the functions expected to go through if 
  // getMachineName, buildTransactionMessage and sendTransactionMessage were called, in this order
  expect(response).toEqual([{prop: 'mock message'}])
})