const fs = require('fs')
const path = require('path')

const coinUtils = require('../coin-utils')
const options = require('../options')

const common = require('./common')

module.exports = {setup}

const coinRec = coinUtils.getCryptoCurrency('BTC')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  const blockchainDir = options.blockchainDir
  fs.writeFileSync(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${blockchainDir}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500`
}
