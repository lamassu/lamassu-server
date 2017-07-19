const coinUtils = require('../coin-utils')

const common = require('./common')

module.exports = {setup}

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('ETH')
  common.firewall([coinRec.defaultPort])
  const cmd = `/usr/local/bin/${coinRec.daemon} --datadir "${dataDir}" --cache 500 --rpc`
  common.writeSupervisorConfig(coinRec, cmd)
}
