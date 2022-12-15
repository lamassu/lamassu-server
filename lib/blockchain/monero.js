const path = require('path')

const { utils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

const coinRec = utils.getCryptoCurrency('XMR')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const auth = `lamassuserver:${common.randomPass()}`
  const config = buildConfig(auth)
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} --no-zmq --data-dir ${dataDir} --config-file ${dataDir}/${coinRec.configFile}`
  const walletCmd = `/usr/local/bin/${coinRec.wallet} --rpc-login ${auth} --daemon-host 127.0.0.1 --daemon-port 18081 --trusted-daemon --daemon-login ${auth} --rpc-bind-port 18082 --wallet-dir ${dataDir}/wallets`
  common.writeSupervisorConfig(coinRec, cmd, walletCmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Monero. This may take a minute...')
  common.es(`sudo supervisorctl stop monero monero-wallet`)
  common.es(`curl -#o /tmp/monero.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/monero.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Monero: Package signature do not match!')
    return
  }
  common.es(`tar -xf /tmp/monero.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/monerod /usr/local/bin/monerod`)
  common.es(`cp /tmp/${coinRec.dir}/monero-wallet-rpc /usr/local/bin/monero-wallet-rpc`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/monero.tar.gz`)

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start monero monero-wallet`)
  }

  common.logger.info('Monero is updated!')
}

function buildConfig (auth) {
  return `rpc-login=${auth}
stagenet=0
restricted-rpc=1
db-sync-mode=safe
out-peers=20
in-peers=20
prune-blockchain=1
`
}
