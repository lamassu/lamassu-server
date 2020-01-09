const CardanoApiFetcher = require('./api/fetcher')
const CardanoApi = require('./api/api')

const axios = require('axios')
const https = require('https')
const fs = require('fs')

const coinUtils = require('../../../coin-utils')

const cryptoRec = coinUtils.getCryptoCurrency('ADA')
//const cryptoDir = coinUtils.cryptoDir(cryptoRec)

const httpsAgent = new https.Agent({
  ca: fs.readFileSync('/usr/local/cardano-node-binary/tls/client/ca.crt'),
  cert: fs.readFileSync('/usr/local/cardano-node-binary/tls/client/client.crt'),
  key: fs.readFileSync('/usr/local/cardano-node-binary/tls/client/client.key')
})
const client = axios.create({ httpsAgent })

const fetcher = new CardanoApiFetcher(client, cryptoRec.defaultPort)
module.exports = new CardanoApi(fetcher)
