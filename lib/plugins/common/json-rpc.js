// JSON-RPC for bitcoind-like interfaces
const axios = require('axios')
const uuid = require('uuid')
const fs = require('fs')
const _ = require('lodash/fp')
const request = require('request-promise')

module.exports = {fetch, fetchDigest, parseConf}

function fetch (account = {}, method, params) {
  params = _.defaultTo([], params)

  return Promise.resolve(true)
    .then(() => {
      const data = {
        method,
        params,
        id: uuid.v4()
      }

      if (_.isNil(account.port)) throw new Error('port attribute required for jsonRpc')

      const url = _.defaultTo(`http://localhost:${account.port}`, account.url)

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
        JSON.stringify(_.get('message', err, '')),
        JSON.stringify(_.get('response.data.error', err, ''))
      ]))
    })
}

function fetchDigest(account = {}, method, params = []) {
  return Promise.resolve(true)
    .then(() => {
      if (_.isNil(account.port))
        throw new Error('port attribute required for jsonRpc')

      const headers = {
        'Content-Type': 'application/json'
      }

      const dataString = `{"jsonrpc":"2.0","id":"${uuid.v4()}","method":"${method}","params":${JSON.stringify(params)}}`

      const options = {
        url: `http://localhost:${account.port}/json_rpc`,
        method: 'POST',
        headers,
        body: dataString,
        forever: true,
        auth: {
          user: account.username,
          pass: account.password,
          sendImmediately: false
        }
      }

      return request(options)
    })
    .then((res) => {
      const r = JSON.parse(res)
      if (r.error) throw r.error
      return r.result
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

function rpcConfig (cryptoRec) {
  try {
    const configPath = coinUtils.configPath(cryptoRec)
    const config = parseConf(configPath)
    return {
      username: config.rpcuser,
      password: config.rpcpassword,
      port: config.rpcport || cryptoRec.defaultPort
    }
  } catch (err) {
    throw new Error('Wallet is currently not installed')
  }
}
