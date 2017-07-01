const fs = require('fs')
const path = require('path')

const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const es = common.es

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('DASH')
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  fs.writeFileSync(path.resolve(dataDir, coinRec.configFile), config)
  setupPm2(dataDir)
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500`
}

function setupPm2 (dataDir) {
  es(`pm2 start /usr/local/bin/dashd -- -datadir=${dataDir}`)
}
