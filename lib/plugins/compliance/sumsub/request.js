const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash/fp')
const FormData = require('form-data')
const settingsLoader = require('../../../new-settings-loader')

const ph = require('../../../plugin-helper')

const axiosConfig = {
  baseURL: 'https://api.sumsub.com'
}

const axiosInstance = axios.create(axiosConfig)

const buildSignature = config => {
  return settingsLoader.loadLatest()
    .then(({ accounts }) => ph.getAccountInstance(accounts.sumsub, 'sumsub'))
    .then(({ secretKey, apiToken }) => {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = crypto.createHmac('sha256', secretKey)
      
      signature.update(`${timestamp}${_.toUpper(config.method)}${config.url}`)
      if (config.data instanceof FormData) {
        signature.update(config.data.getBuffer())
      } else if (config.data) {
        signature.update(config.data)
      }

      config.headers['X-App-Token'] = apiToken
      config.headers['X-App-Access-Sig'] = signature.digest('hex')
      config.headers['X-App-Access-Ts'] = timestamp

      return config
    })
}

axiosInstance.interceptors.request.use(buildSignature, Promise.reject)

const request = config => axiosInstance(config)

module.exports = request
