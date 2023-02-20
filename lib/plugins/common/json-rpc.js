// JSON-RPC for bitcoind-like interfaces
const axios = require('axios')
const uuid = require('uuid')
const fs = require('fs')
const _ = require('lodash/fp')
const request = require('request-promise')
const { utils: coinUtils } = require('@lamassu/coins')

const logger = require('../../logger')
const { isRemoteNode, isRemoteWallet } = require('../../environment-helper')
const { isEnvironmentValid } = require('../../blockchain/install')

const BLOCKCHAIN_DIR = process.env.BLOCKCHAIN_DIR


module.exports = {
  fetch, fetchDigest, parseConf, rpcConfig
}

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

      const url = _.defaultTo(`http://${account.host}:${account.port}`, account.url)

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
      throw new Error(JSON.stringify({
        responseMessage: _.get('message', err),
        message: _.get('response.data.error.message', err),
        code: _.get('response.data.error.code', err)
      }))
    })
}

function generateDigestOptions (account = {}, method, params) {
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

  return options
}

function fetchDigest(account = {}, method, params = []) {
  return Promise.resolve(true)
    .then(() => {
      if (_.isNil(account.port))
        throw new Error('port attribute required for jsonRpc')

      const options = generateDigestOptions(account, method, params)
      return request(options)
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
    if (isRemoteWallet(cryptoRec) && isEnvironmentValid(cryptoRec)) {
      return {
        username: process.env[`${cryptoRec.cryptoCode}_NODE_USER`],
        password: process.env[`${cryptoRec.cryptoCode}_NODE_PASSWORD`],
        host: process.env[`${cryptoRec.cryptoCode}_NODE_RPC_HOST`],
        port: process.env[`${cryptoRec.cryptoCode}_NODE_RPC_PORT`]
      }
    }

    const configPath = coinUtils.configPath(cryptoRec, BLOCKCHAIN_DIR)
    const config = parseConf(configPath)
    
    return {
      username: config.rpcuser,
      password: config.rpcpassword,
      host: 'localhost',
      port: config.rpcport || cryptoRec.defaultPort
    }
  } catch (err) {
    if (!isEnvironmentValid(cryptoRec)) {
      logger.error('Environment is not correctly setup for remote wallet usage!')
    } else {
      logger.error('Wallet is currently not installed!')
    }
    return {
      port: cryptoRec.defaultPort
    }
  }
}
