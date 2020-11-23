const utils = require('../utils')

const plugins = {
  sendMessage: rec => {
    return rec
  }
}

const alertRec = {
  devices: {
    f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05: {
      balanceAlerts: [],
      deviceAlerts: [
        { code: 'PING', age: 1605532263169, machineName: 'Abc123' }
      ]
    }
  },
  deviceNames: {
    f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05: 'Abc123'
  },
  general: []
}

const notifications = {
  sms: { active: true, errors: true },
  email: { active: false, errors: false }
}

test('Build alert fingerprint returns null if no sms or email alerts', () => {
  expect(
    utils.buildAlertFingerprint(
      {
        devices: {},
        deviceNames: {},
        general: []
      },
      notifications
    )
  ).toBe(null)
})

test('Build alert fingerprint returns null if sms and email are disabled', () => {
  expect(
    utils.buildAlertFingerprint(alertRec, {
      sms: { active: false, errors: true },
      email: { active: false, errors: false }
    })
  ).toBe(null)
})

test('Build alert fingerprint returns hash if email or [sms] are enabled and there are alerts in alertrec', () => {
  expect(
    typeof utils.buildAlertFingerprint(alertRec, {
      sms: { active: true, errors: true },
      email: { active: false, errors: false }
    })
  ).toBe('string')
})

test('Build alert fingerprint returns hash if [email] or sms are enabled and there are alerts in alertrec', () => {
  expect(
    typeof utils.buildAlertFingerprint(alertRec, {
      sms: { active: false, errors: false },
      email: { active: true, errors: true }
    })
  ).toBe('string')
})

test('Send no alerts returns empty object with sms and email disabled', () => {
  expect(utils.sendNoAlerts(plugins, false, false)).toEqual({})
})

test('Send no alerts returns object with sms prop with sms only enabled', () => {
  expect(utils.sendNoAlerts(plugins, true, false)).toEqual({
    sms: {
      body: '[Lamassu] All clear'
    }
  })
})

test('Send no alerts returns object with sms and email prop with both enabled', () => {
  expect(utils.sendNoAlerts(plugins, true, true)).toEqual({
    email: {
      body: 'No errors are reported for your machines.',
      subject: '[Lamassu] All clear'
    },
    sms: {
      body: '[Lamassu] All clear'
    }
  })
})

test('Send no alerts returns object with email prop if only email is enabled', () => {
  expect(utils.sendNoAlerts(plugins, false, true)).toEqual({
    email: {
      body: 'No errors are reported for your machines.',
      subject: '[Lamassu] All clear'
    }
  })
})
