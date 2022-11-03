const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash/fp')

const axiosConfig = {
  baseURL: 'https://api.sumsub.com'
}

const axiosInstance = axios.create(axiosConfig)

axiosInstance.interceptors.request.use(buildSignature, Promise.reject)

// TODO: Fake keys from their reference, remove after
const SUMSUB_APP_TOKEN = 'sbx:uY0CgwELmgUAEyl4hNWxLngb.0WSeQeiYny4WEqmAALEAiK2qTC96fBad'
const SUMSUB_SECRET_KEY = 'Hej2ch71kG2kTd1iIUDZFNsO5C1lh5Gq'

const buildSignature = config => {
  return Promise.resolve({ secretKey: SUMSUB_SECRET_KEY, appToken: SUMSUB_APP_TOKEN })
    .then(({ secretKey, appToken }) => {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = crypto.createHmac('sha256', secretKey)
      
      signature.update(`${timestamp}${_.toUpper(config.method)}${config.url}`)
      signature.update(config.data instanceof FormData ? config.data.getBuffer() : config.data)

      config.headers['X-App-Token'] = appToken
      config.headers['X-App-Access-Sig'] = signature.digest('hex')
      config.headers['X-App-Access-Ts'] = timestamp

      return config
    })
}

const request = config => axiosInstance(config)

module.exports = request
