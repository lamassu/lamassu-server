// JSON-RPC for bitcoind-like interfaces
const axios = require('axios')
const uuid = require('uuid')
const fs = require('fs')
const _ = require('lodash/fp')

module.exports = {fetch, parseConf}

function fetch (account, method, params) {
  return Promise.resolve(true)
    .then(() => {
      const data = {
        method,
        params,
        id: uuid.v4()
      }
      const url = _.defaultTo(`http://localhost:${account.port}`, params.url)

      return axios({
        method: 'post',
        auth: {username: account.username, password: account.password},
        url,
        data
      })
    })
    .then(r => {
      if (r.error) throw r.error
      return r.data.result
    })
    .catch(err => {
      throw new Error(_.join(' ', [
        'json-rpc::axios error:',
        _.get('message', err, ''),
        _.get('response.data.error', err, '')
      ]))
    })
}

function split (str) {
  const i = str.indexOf('=')
  if (i === -1) return []
  return [str.slice(0, i), str.slice(i + 1)]
}

function parseConf (confPath) {
  const conf = fs.readFileSync(confPath)
  const lines = conf.toString().split('\n')

  const res = {}
  for (let i = 0; i < lines.length; i++) {
    const keyVal = split(lines[i])

    // skip when value is empty
    if (!keyVal[1]) continue

    res[keyVal[0]] = keyVal[1]
  }

  return res
}
