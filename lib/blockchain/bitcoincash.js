const path = require('path')

const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const coinRec = coinUtils.getCryptoCurrency('BCH')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir} -conf=${dataDir}/bitcoincash.conf`
  common.writeSupervisorConfig(coinRec, cmd)
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500
server=1
maxconnections=40
keypool=10000
prune=4000
daemon=0
bind=0.0.0.0:8334
rpcport=8335
`
}
