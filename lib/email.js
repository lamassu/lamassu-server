var SMTPConnection = require('smtp-connection')

/*

Nice job signing up! Let's finish getting you set up.
Simply change the settings in your email software to these:
SMTP Server:  mail.smtp2go.com
SMTP Port:  2525 (recommended)
Username:  josh@lamassu.is
Password:  view / edit
*/

var options = {
  port: 2525,
  host: 'mail.smtp2go.com',
  requireTLS: true
}

function send (from, to, subject, body, cb) {
  var connection = new SMTPConnection(options)
  connection.connect(function () {
    connection.login({user: 'josh@lamassu.is', pass: 'HPtXGp}9baafiqns%6YFH'}, function (err) {
      if (err) return console.error(err)
      var envelope = {
        from: from,
        to: to
      }
      var message = 'Subject: ' + subject + '\n\n' + body
      connection.send(envelope, message, function (err, info) {
        connection.quit()
        cb(err, info)
      })
    })
  })
}

send('josh@lamassu.is', 'joshmh@gmail.com', 'Another test', 'Screen is stale.\n\nTest3', function (err, info) {
  console.log(err)
  console.log(info)
})
