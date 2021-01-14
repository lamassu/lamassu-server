const cmd = require('./scripts')

process.on('message', async (msg) => {
  console.log('Message from parent:', msg)

  await cmd.execCommand(`node --prof ../../bin/lamassu-server --mockSms --testDB`)
})
