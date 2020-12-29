const path = require('path')

const { utils } = require('lamassu-coins')
// const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const coinRec = utils.getCryptoCurrency('BTC')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir}`
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
daemon=0
addresstype=p2sh-segwit
walletrbf=1`
}
