const NAME = 'mock-email'

function sendMessage (settings, rec) {
  console.log('sending email', rec)
}

function sendCustomerMessage(settings, rec) {
  console.log('sending email', rec)
}

module.exports = {
  NAME,
  sendMessage,
  sendCustomerMessage
}
