const path = require('path')

const { utils } = require('lamassu-coins')

const common = require('./common')

module.exports = {setup}

const coinRec = utils.getCryptoCurrency('DASH')

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
keypool=10000
litemode=1
prune=4000
txindex=0
enableprivatesend=1
privatesendautostart=1`
}
