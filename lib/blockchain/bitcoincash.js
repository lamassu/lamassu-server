const path = require('path')

const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

const coinRec = coinUtils.getCryptoCurrency('BCH')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir} -conf=${dataDir}/bitcoincash.conf`
  common.writeSupervisorConfig(coinRec, cmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Bitcoin Cash. This may take a minute...')
  common.es(`sudo supervisorctl stop bitcoincash`)
  common.es(`curl -#Lo /tmp/bitcoincash.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/bitcoincash.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Bitcoin Cash: Package signature do not match!')
    return
  }
  common.es(`tar -xzf /tmp/bitcoincash.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/bitcoind /usr/local/bin/bitcoincashd`)
  common.es(`cp /tmp/${coinRec.dir}/bitcoin-cli /usr/local/bin/bitcoincash-cli`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/bitcoincash.tar.gz`)

  if (common.es(`grep "listenonion=" /mnt/blockchains/bitcoincash/bitcoincash.conf || true`)) {
    common.logger.info(`listenonion already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'listenonion=0' in config file...`)
    common.es(`echo "\nlistenonion=0" >> /mnt/blockchains/bitcoincash/bitcoincash.conf`)
  }

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start bitcoincash`)
  }

  common.logger.info('Bitcoin Cash is updated!')
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
bind=0.0.0.0:8335
rpcport=8336
listenonion=0
`
}
