const Mailjet = require('node-mailjet')

const NAME = 'Mailjet'

function sendMessage (account, rec) {
  const mailjet = Mailjet.connect(account.apiKey, account.apiSecret)
  const sendEmail = mailjet.post('send')

  const emailData = {
    FromEmail: account.fromEmail,
    FromName: 'Lamassu Server',
    Subject: rec.email.subject,
    'Text-part': rec.email.body,
    Recipients: [{'Email': account.toEmail}]
  }

  return sendEmail.request(emailData)
}

module.exports = {
  NAME,
  sendMessage
}
