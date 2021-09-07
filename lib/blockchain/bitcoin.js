const path = require('path')

const { utils: coinUtils } = require('lamassu-coins')

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
  if (isCurrentlyRunning) common.es(`sudo supervisorctl stop bitcoin`)
  common.es(`curl -#o /tmp/bitcoin.tar.gz ${coinRec.url}`)
  common.es(`tar -xzf /tmp/bitcoin.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/* /usr/local/bin/`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/bitcoin.tar.gz`)

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
addresstype=p2sh-segwit
walletrbf=1
bind=0.0.0.0:8332
rpcport=8333`
}
