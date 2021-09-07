const path = require('path')

const { utils: coinUtils } = require('lamassu-coins')

const common = require('./common')

module.exports = { setup, updateCore }

const coinRec = coinUtils.getCryptoCurrency('DASH')

function setup (dataDir) {
  common.firewall([coinRec.defaultPort])
  const config = buildConfig()
  common.writeFile(path.resolve(dataDir, coinRec.configFile), config)
  const cmd = `/usr/local/bin/${coinRec.daemon} -datadir=${dataDir}`
  common.writeSupervisorConfig(coinRec, cmd)
}

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating Dash Core. This may take a minute...')
  if (isCurrentlyRunning) common.es(`sudo supervisorctl stop dash`)
  common.es(`curl -#Lo /tmp/dash.tar.gz ${coinRec.url}`)
  common.es(`tar -xzf /tmp/dash.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/bin/* /usr/local/bin/`)
  common.es(`rm -r /tmp/${coinRec.dir.replace('/bin', '')}`)
  common.es(`rm /tmp/dash.tar.gz`)

  if (common.es(`grep -x "enableprivatesend=." /mnt/blockchains/dash/dash.conf`)) {
    common.logger.info(`Switching from 'PrivateSend' to 'CoinJoin'...`)
    common.es(`sed -i 's/enableprivatesend/enablecoinjoin/g' /mnt/blockchains/dash/dash.conf`)
  } else if (common.es(`grep -x "enablecoinjoin=." /mnt/blockchains/dash/dash.conf`)) {
    common.logger.info(`enablecoinjoin already defined, skipping...`)
  } else {
    common.logger.info(`Enabling CoinJoin in config file...`)
    common.es(`echo -e "enablecoinjoin=1" >> /mnt/blockchains/dash/dash.conf`)
  }

  if (common.es(`grep -x "privatesendautostart=." /mnt/blockchains/dash/dash.conf`)) {
    common.logger.info(`Switching from 'PrivateSend' to 'CoinJoin'...`)
    common.es(`sed -i 's/privatesendautostart/coinjoinautostart/g' /mnt/blockchains/dash/dash.conf`)
  } else if (common.es(`grep -x "coinjoinautostart=." /mnt/blockchains/dash/dash.conf`)) {
    common.logger.info(`coinjoinautostart already defined, skipping...`)
  } else {
    common.logger.info(`Enabling CoinJoin AutoStart in config file...`)
    common.es(`echo -e "coinjoinautostart=1" >> /mnt/blockchains/dash/dash.conf`)
  }

  if (common.es(`grep -x "litemode=." /mnt/blockchains/dash/dash.conf`)) {
    common.logger.info(`Switching from 'LiteMode' to 'DisableGovernance'...`)
    common.es(`sed -i 's/litemode/disablegovernance/g' /mnt/blockchains/dash/dash.conf`)
  } else {
    common.es(`echo "disablegovernance already defined, skipping..."`)
  }

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start dash`)
  }

  common.logger.info('Dash Core is updated!')
}

function buildConfig () {
  return `rpcuser=lamassuserver
rpcpassword=${common.randomPass()}
dbcache=500
keypool=10000
disablegovernance=1
prune=4000
txindex=0
enablecoinjoin=1
coinjoinautostart=1`
}
