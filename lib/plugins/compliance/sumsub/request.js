const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash/fp')
const FormData = require('form-data')

const axiosConfig = {
  baseURL: 'https://api.sumsub.com'
}

const getSigBuilder = (apiToken, secretKey) => config => {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto.createHmac('sha256', secretKey)

  signature.update(`${timestamp}${_.toUpper(config.method)}${config.url}`)
  if (config.data instanceof FormData) {
    signature.update(config.data.getBuffer())
  } else if (config.data) {
    signature.update(JSON.stringify(config.data))
  }

  config.headers['X-App-Token'] = apiToken
  config.headers['X-App-Access-Sig'] = signature.digest('hex')
  config.headers['X-App-Access-Ts'] = timestamp

  return config
}

const request = ((account, config) => {
  const instance = axios.create(axiosConfig)
  instance.interceptors.request.use(getSigBuilder(account.apiToken, account.secretKey), Promise.reject)
  return instance(config)
})

module.exports = request
