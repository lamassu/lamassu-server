const Mailgun = require('mailgun-js')

const NAME = 'Mailgun'

function sendMessage ({apiKey, domain, fromEmail, toEmail}, rec) {
  const mailgun = Mailgun({apiKey, domain})

  const emailData = {
    from: `Lamassu Server ${fromEmail}`,
    to: toEmail,
    subject: rec.email.subject,
    text: rec.email.body
  }

  return mailgun.messages().send(emailData)
}

module.exports = {
  NAME,
  sendMessage
}
