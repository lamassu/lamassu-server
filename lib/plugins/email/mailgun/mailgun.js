const Mailgun = require('mailgun-js')

const NAME = 'Mailgun'

function sendMessage ({apiKey, domain, fromEmail, toEmail}, rec) {
  const mailgun = Mailgun({apiKey, domain})
  const to = rec.email.toEmail ?? toEmail

  const emailData = {
    from: `Lamassu Server ${fromEmail}`,
    to,
    subject: rec.email.subject,
    text: rec.email.body
  }

  return mailgun.messages().send(emailData)
}

function sendCustomerMessage ({apiKey, domain, fromEmail}, rec) {
  const mailgun = Mailgun({apiKey, domain})
  const to = rec.email.toEmail

  const emailData = {
    from: fromEmail,
    to,
    subject: rec.email.subject,
    text: rec.email.body
  }

  return mailgun.messages().send(emailData)
}

module.exports = {
  NAME,
  sendMessage,
  sendCustomerMessage
}
