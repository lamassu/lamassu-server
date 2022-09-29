const fs = require('fs')
const axios = require('axios')

const updatesRepoUrl = 'https://raw.githubusercontent.com/josepfo/l-m-test-patches/main/manifest.json'

function sync () {
  return axios({
    method: 'GET',
    url: updatesRepoUrl,
    responseType: 'stream'
  }).then(function (response) {
    response.data.pipe(fs.createWriteStream('manifest.json'))
  })
}

module.exports = { sync }
