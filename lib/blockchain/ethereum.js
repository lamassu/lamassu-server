const { utils: coinUtils } = require('@lamassu/coins')

const common = require('./common')

module.exports = { setup, updateCore }

function updateCore (coinRec, isCurrentlyRunning) {
  common.logger.info('Updating the Geth Ethereum wallet. This may take a minute...')
  common.es(`sudo supervisorctl stop ethereum`)
  common.es(`curl -#o /tmp/ethereum.tar.gz ${coinRec.url}`)
  if (common.es(`sha256sum /tmp/ethereum.tar.gz | awk '{print $1}'`).trim() !== coinRec.urlHash) {
    common.logger.info('Failed to update Geth: Package signature do not match!')
    return
  }
  common.es(`tar -xzf /tmp/ethereum.tar.gz -C /tmp/`)

  common.logger.info('Updating wallet...')
  common.es(`cp /tmp/${coinRec.dir}/geth /usr/local/bin/geth`)
  common.es(`rm -r /tmp/${coinRec.dir}`)
  common.es(`rm /tmp/ethereum.tar.gz`)

  if (isCurrentlyRunning) {
    common.logger.info('Starting wallet...')
    common.es(`sudo supervisorctl start ethereum`)
  }

  common.logger.info('Geth is updated!')
}

function setup (dataDir) {
  const coinRec = coinUtils.getCryptoCurrency('ETH')
  common.firewall([coinRec.defaultPort])
  const cmd = `/usr/local/bin/${coinRec.daemon} --datadir "${dataDir}" --syncmode="light" --cache 2048 --maxpeers 40 --http`
  common.writeSupervisorConfig(coinRec, cmd)
}
