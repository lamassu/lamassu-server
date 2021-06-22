const path = require('path')

const fs = require('fs')

const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = { setup }

const coinRec = coinUtils.getCryptoCurrency('BTC')

function setup (dataDir, blockchainDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  if (!fs.existsSync(`${blockchainDir}/bitcoin/wallet.dat)`)) {
    console.log('Created new wallet!')
    common.es(`bitcoin-wallet -wallet=${blockchainDir}/bitcoin/wallet.dat create`)
  }
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir} -wallet=${blockchainDir}/bitcoin/wallet.dat`
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
