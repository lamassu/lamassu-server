const path = require('path')

const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

const es = common.es
const logger = common.logger

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating your Zcash wallet. This may take a minute...')
  common.es(`sudo supervisorctl stop zcash`)
  common.es(`curl -#Lo /tmp/zcash.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/zcash.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Zcash: Package signature do not match!')
    return
  }
  common.es(`tar -xzf /tmp/zcash.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/* /usr/local/bin/`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/zcash.tar.gz`)

  if (common.es(`grep "walletrequirebackup=" /mnt/blockchains/zcash/zcash.conf || true`)) {
    common.logger.info(`walletrequirebackup already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'walletrequirebackup=false' in config file...`)
    common.es(`echo "\nwalletrequirebackup=false" >> /mnt/blockchains/zcash/zcash.conf`)
  }

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start zcash`)
  }

  common.logger.info('Zcash is updated!')
}

function setup (dataDir) {
  es('sudo apt-get update')
  es('sudo apt-get install libgomp1 -y')
  const coinRec = coinUtils.getCryptoCurrency('ZEC')

  common.firewall([coinRec.defaultPort])
  logger.info('Fetching Zcash proofs, will take a while...')
  es('zcash-fetch-params 2>&1')
  logger.info('Finished fetching proofs.')
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function buildConfig () {
  return `mainnet=1
addnode=mainnet.z.cash
rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500
keypool=10000
walletrequirebackup=false
`
}
