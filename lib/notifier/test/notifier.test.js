const notifier = require('..')

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

const devices = [
  {
    deviceId:
      '7e531a2666987aa27b9917ca17df7998f72771c57fdb21c90bc033999edd17e4',
    lastPing: '2020-11-16T13:11:03.169Z',
    name: 'Abc123'
  },
  {
    deviceId:
      '9871e58aa2643ff9445cbc299b50397430ada75157d6c29b4c93548fff0f48f7',
    lastPing: '2020-11-16T16:21:35.948Z',
    name: 'Machine 2'
  },
  {
    deviceId:
      '5ae0d02dedeb77b6521bd5eb7c9159bdc025873fa0bcb6f87aaddfbda0c50913',
    lastPing: '2020-11-19T15:07:57.089Z',
    name: 'Machine 3'
  },
  {
    deviceId:
      'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    lastPing: '2020-11-23T19:34:41.031Z',
    name: 'New Machine 4 '
  }
]

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

afterEach(() => {
  // https://stackoverflow.com/questions/58151010/difference-between-resetallmocks-resetmodules-resetmoduleregistry-restoreallm
  jest.restoreAllMocks()
})

const utils = require('../utils')

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
  expect(notifier.checkStuckScreen([{
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":false}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "1999-11-23T19:30:29.177Z",
    age: 157352628.123
  }, {
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":true}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "2020-11-23T19:30:29.177Z",
    age: 157352628.123
  }])).toEqual([])
})

test('checkStuckScreen returns object array of length 1 with prop code: "STALE" if age > STALE_STATE', () => {
  // there is an age 0 and an isIdle true in the first object but it will be below the second one in the sorting order and thus ignored
  const result = notifier.checkStuckScreen([{
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":true}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "1999-11-23T19:30:29.177Z",
    age: 0
  }, {
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":false}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "2020-11-23T19:30:29.177Z",
    age: 157352628.123
  }])
  expect(result[0]).toMatchObject({code: "STALE"})
})

test('checkStuckScreen returns empty array if age < STALE_STATE', () => {
  const STALE_STATE = require("../codes").STALE_STATE
  const result1 = notifier.checkStuckScreen([{
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":false}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "2020-11-23T19:30:29.177Z",
    age: 0
  }])
  const result2 = notifier.checkStuckScreen([{
    id: '48ae51c6-c5b4-485e-b81d-aa337fc025e2',
    device_id: 'f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05',
    event_type: 'stateChange',
    note: '{"state":"chooseCoin","isIdle":false}',
    created: "2020-11-23T19:30:29.209Z",
    device_time: "2020-11-23T19:30:29.177Z",
    age: STALE_STATE
  }])
  expect(result1).toEqual([])
  expect(result2).toEqual([])
})