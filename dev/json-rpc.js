const rpc = require('../lib/plugins/common/json-rpc')

const account = {
  username: 'test',
  password: 'test',
  port: 8080
}

const method = {}

const params = {
  // url: 'https://httpstat.us/500'
  // url: 'https://httpstat.us/400'
  // url: 'https://httpstat.us/200'
}

rpc.fetch(account, method, params)
  .then(res => console.log('got result', res))
  .catch(err => console.error('gor error', err))
