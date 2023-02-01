const path = require('path')
const _ = require('lodash/fp')

const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')
const { isDevMode, isRemoteNode } = require('../environment-helper')

module.exports = { setup, updateCore }

const coinRec = coinUtils.getCryptoCurrency('BTC')

const BLOCKCHAIN_DIR = process.env.BLOCKCHAIN_DIR

const tmpDir = isDevMode() ? path.resolve(BLOCKCHAIN_DIR, 'tmp') : '/tmp'
const usrBinDir = isDevMode() ? path.resolve(BLOCKCHAIN_DIR, 'bin') : '/usr/local/bin'

function setup (dataDir) {
  !isDevMode() && common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `${usrBinDir}/${coinRec.daemon} -datadir=${dataDir}`
  !isDevMode() && common.writeSupervisorConfig(coinRec, cmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Bitcoin Core. This may take a minute...')
  !isDevMode() && common.es(`sudo supervisorctl stop bitcoin`)
  common.es(`curl -#o /tmp/bitcoin.tar.gz ${coinRec.url}`)
  common.es(`tar -xzf /tmp/bitcoin.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp ${tmpDir}/${coinRec.dir}/* ${usrBinDir}/`)
  common.es(`rm -r ${tmpDir}/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm ${tmpDir}/bitcoin.tar.gz`)

  if (common.es(`grep "addresstype=p2sh-segwit" ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`Enabling bech32 receiving addresses in config file..`)
    common.es(`sed -i 's/addresstype=p2sh-segwit/addresstype=bech32/g' ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf`)
  } else {
    common.logger.info(`bech32 receiving addresses already defined, skipping...`)
  }

  if (common.es(`grep "changetype=" ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`changetype already defined, skipping...`)
  } else {
    common.logger.info(`Enabling bech32 change addresses in config file..`)
    common.es(`echo "\nchangetype=bech32" >> ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf`)
  }

  if (common.es(`grep "listenonion=" ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf || true`)) {
    common.logger.info(`listenonion already defined, skipping...`)
  } else {
    common.logger.info(`Setting 'listenonion=0' in config file...`)
    common.es(`echo "\nlistenonion=0" >> ${BLOCKCHAIN_DIR}/bitcoin/bitcoin.conf`)
  }

  if (isCurrentlyRunning && !isDevMode()) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start bitcoin`)
  }

  common.logger.info('Bitcoin Core is updated!')
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
${isDevMode() ? `regtest=1` : ``}
dbcache=500
server=1
connections=40
keypool=10000
prune=4000
daemon=0
addresstype=bech32
changetype=bech32
walletrbf=1
listenonion=0
fallbackfee=0.00005
rpcworkqueue=2000
${isDevMode()
  ? `[regtest]
rpcport=18333
bind=0.0.0.0:18332
${isRemoteNode(coinRec) ? `connect=${process.env.BTC_NODE_HOST}:${process.env.BTC_NODE_PORT}` : ``}`
  : `rpcport=8333
bind=0.0.0.0:8332
${isRemoteNode(coinRec) ? `connect=${process.env.BTC_NODE_HOST}:${process.env.BTC_NODE_PORT}` : ``}`}
`
}
