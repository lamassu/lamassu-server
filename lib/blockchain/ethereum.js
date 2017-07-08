const coinUtils = require('../coin-utils')
const options = require('../options')

const common = require('./common')

module.exports = {setup}

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('ETH')
  common.firewall([coinRec.defaultPort])
  const blockchainDir = options.blockchainDir
  const cmd = `/usr/local/bin/${coinRec.daemon} --datadir "${blockchainDir}" --cache 500`
  common.writeSupervisorConfig(coinRec, cmd)
}
