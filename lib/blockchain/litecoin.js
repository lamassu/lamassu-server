const path = require('path')

const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

const coinRec = coinUtils.getCryptoCurrency('LTC')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Litecoin Core. This may take a minute...')
  common.es(`sudo supervisorctl stop litecoin`)
  common.es(`curl -#o /tmp/litecoin.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/litecoin.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Litecoin Core: Package signature do not match!')
    return
  }
  common.es(`tar -xzf /tmp/litecoin.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/* /usr/local/bin/`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/litecoin.tar.gz`)

  if (common.es(`grep "changetype=" /mnt/blockchains/litecoin/litecoin.conf || true`)) {
    common.logger.info(`changetype already defined, skipping...`)
  } else {
    common.logger.info(`Enabling bech32 change addresses in config file..`)
    common.es(`echo "\nchangetype=bech32" >> /mnt/blockchains/litecoin/litecoin.conf`)
  }

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start litecoin`)
  }

  common.logger.info('Litecoin Core is updated!')
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
changetype=bech32
`
}
