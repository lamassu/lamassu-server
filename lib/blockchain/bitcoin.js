const path = require('path')

const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

const coinRec = coinUtils.getCryptoCurrency('BTC')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Bitcoin Core. This may take a minute...')
  common.es(`sudo supervisorctl stop bitcoin`)
  common.es(`curl -#o /tmp/bitcoin.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/bitcoin.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Bitcoin Core: Package signature do not match!')
    return
  }
  common.es(`tar -xzf /tmp/bitcoin.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/* /usr/local/bin/`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/bitcoin.tar.gz`)

  if (common.es(`grep "addresstype=p2sh-segwit" /mnt/blockchains/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`Enabling bech32 receiving addresses in config file..`)
    common.es(`sed -i 's/addresstype=p2sh-segwit/addresstype=bech32/g' /mnt/blockchains/bitcoin/bitcoin.conf`)
  } else {
    common.logger.info(`bech32 receiving addresses already defined, skipping...`)
  }

  if (common.es(`grep "changetype=" /mnt/blockchains/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`changetype already defined, skipping...`)
  } else {
    common.logger.info(`Enabling bech32 change addresses in config file..`)
    common.es(`echo "\nchangetype=bech32" >> /mnt/blockchains/bitcoin/bitcoin.conf`)
  }

  if (common.es(`grep "listenonion=" /mnt/blockchains/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`listenonion already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'listenonion=0' in config file...`)
    common.es(`echo "\nlistenonion=0" >> /mnt/blockchains/bitcoin/bitcoin.conf`)
  }

  if (common.es(`grep "fallbackfee=" /mnt/blockchains/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`fallbackfee already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'fallbackfee=0.00005' in config file...`)
    common.es(`echo "\nfallbackfee=0.00005" >> /mnt/blockchains/bitcoin/bitcoin.conf`)
  }

  if (common.es(`grep "rpcworkqueue=" /mnt/blockchains/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`rpcworkqueue already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'rpcworkqueue=2000' in config file...`)
    common.es(`echo "\nrpcworkqueue=2000" >> /mnt/blockchains/bitcoin/bitcoin.conf`)
  }

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start bitcoin`)
  }

  common.logger.info('Bitcoin Core is updated!')
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
addresstype=bech32
changetype=bech32
walletrbf=1
bind=0.0.0.0:8332
rpcport=8333
listenonion=0
fallbackfee=0.00005
rpcworkqueue=2000
`
}
