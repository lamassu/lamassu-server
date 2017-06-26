// JSON-RPC for bitcoind-like interfaces
const axios = require('axios')
const uuid = require('uuid')
const fs = require('fs')

module.exports = {fetch, parseConf}

function fetch (account, method, params) {
  const data = {
    method,
    params,
    id: uuid.v4()
  }

  return axios({
    method: 'post',
    auth: {username: account.username, password: account.password},
    url: `http://localhost:${account.port}`,
    data
  })
  .then(r => {
    if (r.error) throw r.error
    return r.data.result
  })
  .catch(err => {
    console.log(err.response.data.error)
    throw err
  })
}

function parseConf (confPath) {
  const conf = fs.readFileSync(confPath)
  const lines = conf.toString().split('\n', 2)

  const res = {}
  for (let i = 0; i < lines.length; i++) {
    const keyVal = lines[i].split('=')

    // skip when value is empty
    if (!keyVal[1]) continue

    res[keyVal[0]] = keyVal[1]
  }

  return res
}
