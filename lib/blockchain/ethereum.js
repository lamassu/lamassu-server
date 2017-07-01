const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

const es = common.es

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('ETH')
  common.firewall([coinRec.defaultPort])
  setupPm2(dataDir)
}

function setupPm2 (dataDir) {
  es(`pm2 start /usr/local/bin/geth -- --datadir "${dataDir}" --cache 500`)
}
