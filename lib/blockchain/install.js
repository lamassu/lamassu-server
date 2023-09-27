const fs = require('fs')
const path = require('path')
const process = require('process')
const os = require('os')

const makeDir = require('make-dir')
const inquirer = require('inquirer')
const _ = require('lodash/fp')

const { utils: coinUtils } = require('@lamassu/coins')
const settingsLoader = require('../new-settings-loader')
const wallet = require('../wallet')
const { isDevMode, isRemoteNode, isRemoteWallet } = require('../environment-helper')

const common = require('./common')
const doVolume = require('./do-volume')

const cryptos = coinUtils.cryptoCurrencies()

const logger = common.logger

const PLUGINS = {
  BTC: require('./bitcoin.js'),
  BCH: require('./bitcoincash.js'),
  DASH: require('./dash.js'),
  LTC: require('./litecoin.js'),
  XMR: require('./monero.js')
}

const BLOCKCHAIN_DIR = process.env.BLOCKCHAIN_DIR

module.exports = {
  isEnvironmentValid,
  run
}

function installedVolumeFilePath (crypto) {
  return path.resolve(coinUtils.cryptoDir(crypto, BLOCKCHAIN_DIR), '.installed')
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

  const selectedCryptos = _.map(code => _.find(['code', code], cryptos), codes)

  if (isDevMode()) {
    _.forEach(setupCrypto, selectedCryptos)
  } else {
    const goodVolume = doVolume.prepareVolume()

    if (!goodVolume) {
      logger.error('There was an error preparing the disk volume. Exiting.')
      process.exit(1)
    }

    _.forEach(setupCrypto, selectedCryptos)
    common.es('sudo supervisorctl reread')
    common.es('sudo supervisorctl update')

    const blockchainDir = BLOCKCHAIN_DIR
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
  }

  logger.info('Installation complete.')
}

function isEnvironmentValid (crypto) {
  if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_LOCATION`]))
    throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_LOCATION is not set!`)

  if (_.isEmpty(process.env[`${crypto.cryptoCode}_WALLET_LOCATION`]))
    throw new Error(`The environment variable for ${crypto.cryptoCode}_WALLET_LOCATION is not set!`)

  if (isRemoteWallet(crypto) && !isRemoteNode(crypto))
    throw new Error(`Invalid environment setup for ${crypto.display}: It's not possible to use a remote wallet without using a remote node!`)

  if (isRemoteNode(crypto) && !isRemoteWallet(crypto)) {
    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_HOST`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_HOST is not set!`)

    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_PORT`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_PORT is not set!`)

    if (_.isEmpty(process.env.BLOCKCHAIN_DIR))
      throw new Error(`The environment variable for BLOCKCHAIN_DIR is not set!`)
  }

  if (isRemoteWallet(crypto)) {
    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_RPC_HOST`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_RPC_HOST is not set!`)

    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_RPC_PORT`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_RPC_PORT is not set!`)

    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_USER`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_USER is not set!`)

    if (_.isEmpty(process.env[`${crypto.cryptoCode}_NODE_PASSWORD`]))
      throw new Error(`The environment variable for ${crypto.cryptoCode}_NODE_PASSWORD is not set!`)
  }

  return true
}

function setupCrypto (crypto) {
  logger.info(`Installing ${crypto.display}...`)

  if (!isEnvironmentValid(crypto)) throw new Error(`Environment error for ${crypto.display}`)  

  if (isRemoteWallet(crypto)) {
    logger.info(`Environment variable ${crypto.cryptoCode}_WALLET_LOCATION is set as 'remote', so there's no need to install a node in the system. Exiting...`)
    return
  }

  const cryptoDir = coinUtils.cryptoDir(crypto, BLOCKCHAIN_DIR)
  makeDir.sync(cryptoDir)
  const cryptoPlugin = plugin(crypto)
  const oldDir = process.cwd()
  const tmpDir = isDevMode() ? path.resolve(BLOCKCHAIN_DIR, 'tmp', 'blockchain-install') : '/tmp/blockchain-install'

  makeDir.sync(tmpDir)
  process.chdir(tmpDir)
  common.es('rm -rf *')
  common.fetchAndInstall(crypto)

  cryptoPlugin.setup(cryptoDir)

  if (!isDevMode()) {
    common.writeFile(installedVolumeFilePath(crypto), '')
  }

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
      if (isDevMode()) return new Array(_.size(cryptoList)).fill('ready')

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

function isInstalled (crypto) {
  return isDevMode()
    ? isInstalledSoftware(crypto)
    : isInstalledSoftware(crypto) && isInstalledVolume(crypto)
}

function isDisabled (crypto) {
  switch (crypto.cryptoCode) {
    case 'XMR':
      return isInstalled(crypto) && 'Installed' || isInstalled(_.find(it => it.code === 'zcash', cryptos)) && 'Insufficient resources. Contact support.'
    default:
      return isInstalled(crypto) && 'Installed'
  }
}

function run () {  
  const choices = _.flow([
    _.filter(c => !c.hideFromInstall),
    _.map(c => {
      return {
        name: c.display,
        value: c.code,
        checked: isInstalled(c),
        disabled: isDisabled(c)
      }
    }),
  ])(cryptos)

  const questions = []

  const validateAnswers = async (answers) => {
    if (_.size(answers) > 2) return { message: `Please insert a maximum of two coins to install.`, isValid: false }

    if (
      _.isEmpty(_.difference(['monero', 'zcash'], answers)) ||
      (_.includes('monero', answers) && isInstalled(_.find(it => it.code === 'zcash', cryptos))) ||
      (_.includes('zcash', answers) && isInstalled(_.find(it => it.code === 'monero', cryptos)))
    ) {
      return { message: `Zcash and Monero installations are temporarily mutually exclusive, given the space needed for their blockchains. Contact support for more information.`, isValid: false }
    }

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
