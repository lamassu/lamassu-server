const email = require('../email')

const alertRec = {
  devices: {
    f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05: {
      balanceAlerts: [],
      deviceAlerts: [
        { code: 'PING', age: 602784301.446, machineName: 'Abc123' }
      ]
    }
  },
  deviceNames: {
    f02af604ca9010bd9ae04c427a24da90130da10d355f0a9b235886a89008fc05: 'Abc123'
  },
  general: []
}

const printEmailMsg = `Errors were reported by your Lamassu Machines.

Errors for Abc123:
Machine down for ~6 days
`

test('Print Email Alers', () => {
  expect(email.printEmailAlerts(alertRec, { active: true, errors: true })).toBe(
    printEmailMsg
  )
})
