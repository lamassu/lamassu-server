const _ = require('lodash/fp')

const NAME = 'MockSMS'

function getLookup (account, number) {
  console.log('Looking up number: %j', number)
  return new Promise((resolve, reject) => {
    if (_.endsWith('666', number)) {
      reject (new Error(`${exports.NAME} mocked error!`))
    } else {
      setTimeout(resolve, 1)
    }
  })
}

function sendMessage (account, rec) {
  console.log('Sending SMS: %j', rec)
  return new Promise((resolve, reject) => {
    if (_.endsWith('666', _.getOr(false, 'sms.toNumber', rec))) {
      reject(new Error(`${exports.NAME} mocked error!`))
    } else {
      setTimeout(resolve, 10)
    }
  })
}

module.exports = {
  NAME,
  sendMessage,
  getLookup
}
