const fs = require('fs')
const path = require('path')

const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const es = common.es
const logger = common.logger

function setup (dataDir) {
  es('sudo apt-get update')
  es('sudo apt-get install libgomp1 -y')
  const coinRec = coinUtils.getCryptoCurrency('ZEC')

  common.firewall([coinRec.defaultPort])
  logger.info('Fetching Zcash proofs, will take a while...')
  es('zcash-fetch-params 2>&1')
  logger.info('Finished fetching proofs.')
  const config = buildConfig()
  fs.writeFileSync(path.resolve(dataDir, 'zcash.conf'), config)
  setupPm2(dataDir)
}

function buildConfig () {
  return `mainnet=1
addnode=mainnet.z.cash
rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500`
}

function setupPm2 (dataDir) {
  es(`pm2 start /usr/local/bin/zcashd -- -datadir=${dataDir}`)
}
