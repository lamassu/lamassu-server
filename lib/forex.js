const axios = require('axios')

const getFiatRates = () => axios.get('https://bitpay.com/api/rates').then(response => response.data)

module.exports = { getFiatRates }
