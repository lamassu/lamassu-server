exports.NAME = 'MockSMS'

exports.sendMessage = function sendMessage (account, rec) {
  console.log('Sending SMS: %j', rec)
  return Promise.resolve()
}
