const fs = require('fs')
const path = require('path')
const process = require('process')
const os = require('os')

const makeDir = require('make-dir')
const inquirer = require('inquirer')
const _ = require('lodash/fp')

const { utils: coinUtils } = require('@lamassu/coins')
const options = require('../options')
const settingsLoader = require('../new-settings-loader')
const wallet = require('../wallet')

const common = require('./common')
const doVolume = require('./do-volume')

const cryptos = coinUtils.cryptoCurrencies()

const logger = common.logger

const PLUGINS = {
  BTC: require('./bitcoin.js'),
  BCH: require('./bitcoincash.js'),
  DASH: require('./dash.js'),
  ETH: require('./ethereum.js'),
  LTC: require('./litecoin.js'),
  XMR: require('./monero.js'),
  ZEC: require('./zcash.js')
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
  common.es('sudo supervisorctl reread')
  common.es('sudo supervisorctl update')

  const blockchainDir = options.blockchainDir
  const backupDir = path.resolve(os.homedir(), 'backups')
  const rsyncCmd = `( \
    (crontab -l 2>/dev/null || echo -n "") | grep -v "@daily rsync ".*"wallet.dat"; \
    echo "@daily rsync -r --prune-empty-dirs --include='*/' \
                        --include='wallet.dat' \
                        --exclude='*' ${blockchainDir} ${backupDir} > /dev/null" \
  ) | crontab -`
  common.es(rsyncCmd)

  _.forEach(c => {
    updateCrypto(c)
    common.es(`sudo supervisorctl start ${c.code}`)
  }, selectedCryptos)

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

function updateCrypto (crypto) {
  if (!common.isUpdateDependent(crypto.cryptoCode)) return
  const cryptoPlugin = plugin(crypto)
  // TODO: we need to refactor the way we retrieve this status, p.e Monero uses two
  // services with specific names, so each coin should have its implementation.
  // Currently, it's not a breaking change because only BTC is update dependent
  const status = common.es(`sudo supervisorctl status ${crypto.code} | awk '{ print $2 }'`).trim()
  const isCurrentlyRunning = _.includes(status, ['RUNNING', 'STARTING'])
  cryptoPlugin.updateCore(common.getBinaries(crypto.cryptoCode), isCurrentlyRunning)
}

function plugin (crypto) {
  const plugin = PLUGINS[crypto.cryptoCode]
  if (!plugin) throw new Error(`No such plugin: ${crypto.cryptoCode}`)
  return plugin
}

function getBlockchainSyncStatus (cryptoList) {
  return settingsLoader.loadLatest()
    .then(settings => {
      const blockchainStatuses = _.reduce((acc, value) => {
          const processStatus = common.es(`sudo supervisorctl status ${value.code} | awk '{ print $2 }'`).trim()
          return acc.then(a => {
            if (processStatus === 'RUNNING') {
              return wallet.checkBlockchainStatus(settings, value.cryptoCode)
                .then(res => Promise.resolve({ ...a, [value.cryptoCode]: res }))
            }
            return Promise.resolve({ ...a })
          })
        },
        Promise.resolve({}),
        cryptoList
      )

      return blockchainStatuses
    })
}

function run () {  
  const choices = _.flow([
    _.filter(c => c.type !== 'erc-20'),
    _.map(c => {
      const checked = isInstalledSoftware(c) && isInstalledVolume(c)
      const name = c.code === 'ethereum' ? 'Ethereum' : c.display
      return {
        name,
        value: c.code,
        checked,
        disabled: checked && 'Installed'
      }
    }),
  ])(cryptos)

  const questions = []

  const validateAnswers = async (answers) => {
    if (_.size(answers) > 2) return { message: `Please insert a maximum of two coins to install.`, isValid: false }
    return getBlockchainSyncStatus(cryptos)
      .then(blockchainStatuses => {
        const result = _.reduce((acc, value) => ({ ...acc, [value]: _.isNil(acc[value]) ? 1 : acc[value] + 1 }), {}, _.values(blockchainStatuses))
        if (_.size(answers) + result.syncing > 2) {
          return { message: `Installing these coins would pass the 2 parallel blockchain synchronization limit. Please try again with fewer coins or try again later.`, isValid: false }
        }

        if (result.syncing > 2) {
          return { message: `There are currently more than 2 blockchains in their initial synchronization. Please try again later.`, isValid: false }
        }

        return { message: null, isValid: true }
      })
  }

  questions.push({
    type: 'checkbox',
    name: 'crypto',
    message: 'Which cryptocurrencies would you like to install?\nTo prevent server resource overloading, only TWO coins should be syncing simultaneously.\nMore coins can be installed after this process is over.',
    choices
  })

  inquirer.prompt(questions)
    .then(answers => Promise.all([validateAnswers(answers.crypto), answers]))
    .then(([res, answers]) => {
      if (res.isValid) {
        return processCryptos(answers.crypto)
      }
      logger.error(res.message)
    })
}
