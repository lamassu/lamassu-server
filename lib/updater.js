const fs = require('fs')
const axios = require('axios')

const updatesRepoUrl = ''

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
