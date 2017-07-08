const fs = require('fs')
const path = require('path')

const coinUtils = require('../coin-utils')
const options = require('../options')

const common = require('./common')

module.exports = {setup}

const coinRec = coinUtils.getCryptoCurrency('LTC')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  fs.writeFileSync(path.resolve(dataDir, coinRec.configFile), config)
  const blockchainDir = options.blockchainDir
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${blockchainDir}`
  common.writeSupervisorConfig(coinRec, cmd)
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
