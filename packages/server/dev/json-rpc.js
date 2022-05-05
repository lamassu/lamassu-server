const rpc = require('../lib/plugins/common/json-rpc')

const method = ''

// const url = null
// const url = 'https://httpstat.us/500'
// const url = 'https://httpstat.us/400'
const url = 'https://httpstat.us/200'

const account = {
  username: 'test',
  password: 'test',
  port: 8080,
  url
}

rpc.fetch(account, method)
  .then(res => console.log('got result', res))
  .catch(err => console.error('gor error', err))
