const path = require('path')

const { utils } = require('lamassu-coins')

const common = require('./common')

module.exports = {setup}

const coinRec = utils.getCryptoCurrency('XMR')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const auth = `lamassuserver:${common.randomPass()}`
  const config = buildConfig(auth)
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} --data-dir ${dataDir} --config-file ${dataDir}/${coinRec.configFile}`
  const walletCmd = `/usr/local/bin/${coinRec.wallet} --stagenet --rpc-login ${auth} --daemon-host 127.0.0.1 --daemon-port 38081 --trusted-daemon --daemon-login ${auth} --rpc-bind-port 38083 --wallet-dir ${dataDir}/wallets`
  common.writeSupervisorConfig(coinRec, cmd, walletCmd)
}

function buildConfig (auth) {
  return `rpc-login=${auth}
stagenet=1
restricted-rpc=1
db-sync-mode=safe
out-peers=20
in-peers=20
prune-blockchain=1
`
}
