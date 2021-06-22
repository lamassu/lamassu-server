const fs = require('fs')
const path = require('path')
const process = require('process')
const os = require('os')

const makeDir = require('make-dir')
const inquirer = require('inquirer')
const _ = require('lodash/fp')

const { utils: coinUtils } = require('lamassu-coins')
const options = require('../options')

const common = require('./common')
const doVolume = require('./do-volume')

const cryptos = coinUtils.cryptoCurrencies()

const logger = common.logger

const PLUGINS = {
  BTC: require('./bitcoin.js'),
  LTC: require('./litecoin.js'),
  ETH: require('./ethereum.js'),
  DASH: require('./dash.js'),
  ZEC: require('./zcash.js'),
  BCH: require('./bitcoincash.js')
}

module.exports = {run}

function installedVolumeFilePath (crypto) {
  return path.resolve(coinUtils.cryptoDir(crypto, options.blockchainDir), '.installed')
}

function isInstalledVolume (crypto) {
  return fs.existsSync(installedVolumeFilePath(crypto))
}

function isInstalledSoftware (crypto) {
  return common.isInstalledSoftware(crypto)
}

function processCryptos (codes) {
  if (_.isEmpty(codes)) {
    logger.info('No cryptos selected. Exiting.')
    process.exit(0)
  }

  logger.info('Thanks! Installing: %s. Will take a while...', _.join(', ', codes))

  const goodVolume = doVolume.prepareVolume()

  if (!goodVolume) {
    logger.error('There was an error preparing the disk volume. Exiting.')
    process.exit(1)
  }

  const selectedCryptos = _.map(code => _.find(['code', code], cryptos), codes)
  _.forEach(setupCrypto, selectedCryptos)
  common.es('sudo service supervisor restart')

  const blockchainDir = options.blockchainDir
  const backupDir = path.resolve(os.homedir(), 'backups')
  const rsyncCmd = `( \
    (crontab -l 2>/dev/null || echo -n "") | grep -v "@daily rsync ".*"wallet.dat"; \
    echo "@daily rsync -r --prune-empty-dirs --include='*/' \
                        --include='wallet.dat' \
                        --exclude='*' ${blockchainDir} ${backupDir} > /dev/null" \
  ) | crontab -`
  common.es(rsyncCmd)

  logger.info('Installation complete.')
}

function setupCrypto (crypto) {
  logger.info(`Installing ${crypto.display}...`)
  const cryptoDir = coinUtils.cryptoDir(crypto, options.blockchainDir)
  makeDir.sync(cryptoDir)
  const cryptoPlugin = plugin(crypto)
  const oldDir = process.cwd()
  const tmpDir = '/tmp/blockchain-install'

  makeDir.sync(tmpDir)
  process.chdir(tmpDir)
  common.es('rm -rf *')
  common.fetchAndInstall(crypto)

  cryptoPlugin.setup(cryptoDir)

  common.writeFile(installedVolumeFilePath(crypto), '')
  process.chdir(oldDir)
}

function plugin (crypto) {
  const plugin = PLUGINS[crypto.cryptoCode]
  if (!plugin) throw new Error(`No such plugin: ${crypto.cryptoCode}`)
  return plugin
}

function run () {  
  const choices = _.map(c => {
    const checked = isInstalledSoftware(c) && isInstalledVolume(c)
    return {
      name: c.display,
      value: c.code,
      checked,
      disabled: c.cryptoCode === 'ETH'
        ? 'Use admin\'s Infura plugin'
        : checked && 'Installed'
    }
  }, cryptos)

  const questions = []

  questions.push({
    type: 'checkbox',
    name: 'crypto',
    message: 'Which cryptocurrencies would you like to install?',
    choices
  })

  inquirer.prompt(questions)
    .then(answers => processCryptos(answers.crypto))
}
