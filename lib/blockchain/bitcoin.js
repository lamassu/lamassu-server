const fs = require('fs')
const path = require('path')

const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const es = common.es

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('BTC')
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  fs.writeFileSync(path.resolve(dataDir, coinRec.configFile), config)
  setupPm2(dataDir)
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500
server=1
connections=40
keypool=10000
prune=4000
daemon=0`
}

function setupPm2 (dataDir) {
  es(`pm2 start /usr/local/bin/bitcoind -- -datadir=${dataDir}`)
}
