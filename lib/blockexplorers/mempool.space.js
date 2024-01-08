const axios = require("axios");

const getEstimateFeeBtc = () => {
  return axios.get('https://mempool.space/api/v1/fees/recommended')
    .then(r => r.data.hourFee)
}

module.exports = { getEstimateFeeBtc }