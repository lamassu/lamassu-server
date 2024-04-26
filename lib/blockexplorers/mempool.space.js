const axios = require("axios");

const getSatBEstimateFee = () => {
  return axios.get('https://mempool.space/api/v1/fees/recommended')
    .then(r => r.data.hourFee)
}

const getSatBEstimateFees = () => {
  return axios.get('https://mempool.space/api/v1/fees/recommended')
    .then(r => r.data)
}

module.exports = {
  getSatBEstimateFees,
  getSatBEstimateFee
}