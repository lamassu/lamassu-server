const crypto = require('crypto')
const os = require('os')
const path = require('path')
const cp = require('child_process')
const fs = require('fs')
const makeDir = require('make-dir')

const _ = require('lodash/fp')

const logger = require('console-log-level')({level: 'info'})

const { isDevMode } = require('../environment-helper')

const BLOCKCHAIN_DIR = process.env.BLOCKCHAIN_DIR

module.exports = {
  es,
  writeSupervisorConfig,
  firewall,
  randomPass,
  fetchAndInstall,
  logger,
  isInstalledSoftware,
  writeFile,
  getBinaries,
  isUpdateDependent
}

const BINARIES = {
  BTC: {
    defaultUrl: 'https://bitcoincore.org/bin/bitcoin-core-0.20.1/bitcoin-0.20.1-x86_64-linux-gnu.tar.gz',
    defaultDir: 'bitcoin-0.20.1/bin',
    url: 'https://bitcoincore.org/bin/bitcoin-core-27.1/bitcoin-27.1-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-27.1/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.14.8-a9523b64.tar.gz',
    dir: 'geth-linux-amd64-1.14.8-a9523b64'
  },
  ZEC: {
    url: 'https://github.com/zcash/artifacts/raw/master/v5.9.0/bullseye/zcash-5.9.0-linux64-debian-bullseye.tar.gz',
    dir: 'zcash-5.9.0/bin'
  },
  DASH: {
    defaultUrl: 'https://github.com/dashpay/dash/releases/download/v18.1.0/dashcore-18.1.0-x86_64-linux-gnu.tar.gz',
    defaultDir: 'dashcore-18.1.0/bin',
    url: 'https://github.com/dashpay/dash/releases/download/v21.1.0/dashcore-21.1.0-x86_64-linux-gnu.tar.gz',
    dir: 'dashcore-21.1.0/bin'
  },
  LTC: {
    defaultUrl: 'https://download.litecoin.org/litecoin-0.18.1/linux/litecoin-0.18.1-x86_64-linux-gnu.tar.gz',
    defaultDir: 'litecoin-0.18.1/bin',
    url: 'https://download.litecoin.org/litecoin-0.21.3/linux/litecoin-0.21.3-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.21.3/bin'
  },
  BCH: {
    url: 'https://github.com/bitcoin-cash-node/bitcoin-cash-node/releases/download/v27.1.0/bitcoin-cash-node-27.1.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-cash-node-27.1.0/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  },
  XMR: {
    url: 'https://downloads.getmonero.org/cli/monero-linux-x64-v0.18.3.3.tar.bz2',
    dir: 'monero-x86_64-linux-gnu-v0.18.3.3',
    files: [['monerod', 'monerod'], ['monero-wallet-rpc', 'monero-wallet-rpc']]
  }
}

const coinsUpdateDependent = ['BTC', 'LTC', 'DASH']

function firewall (ports) {
  if (!ports || ports.length === 0) throw new Error('No ports supplied')
  const portsString = ports.join(',')
  es(`sudo ufw allow ${portsString}`)
}

function randomPass () {
  return crypto.randomBytes(32).toString('hex')
}

function es (cmd) {
  const env = {HOME: os.userInfo().homedir}
  const options = {encoding: 'utf8', env}
  const res = cp.execSync(cmd, options)
  logger.debug(res)
  return res.toString()
}

function generateSupervisorConfig (cryptoCode, command, isWallet = false) {
  return `[program:${cryptoCode}${isWallet ? `-wallet` : ``}]
command=nice ${command}
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/${cryptoCode}${isWallet ? `-wallet` : ``}.err.log
stdout_logfile=/var/log/supervisor/${cryptoCode}${isWallet ? `-wallet` : ``}.out.log
stderr_logfile_backups=2
stdout_logfile_backups=2
environment=HOME="/root"
`
}

function writeSupervisorConfig (coinRec, cmd, walletCmd = '') {
  if (isInstalledSoftware(coinRec)) return

  const blockchain = coinRec.code

  if (!_.isNil(coinRec.wallet)) {
    const supervisorConfigWallet = generateSupervisorConfig(blockchain, walletCmd, true)
    writeFile(`/etc/supervisor/conf.d/${coinRec.code}-wallet.conf`, supervisorConfigWallet)
  }

  const supervisorConfig = generateSupervisorConfig(blockchain, cmd)
  writeFile(`/etc/supervisor/conf.d/${coinRec.code}.conf`, supervisorConfig)
}

function isInstalledSoftware (coinRec) {
  if (isDevMode()) {
    return fs.existsSync(`${BLOCKCHAIN_DIR}/${coinRec.code}/${coinRec.configFile}`)
      && fs.existsSync(`${BLOCKCHAIN_DIR}/bin/${coinRec.daemon}`)
  }

  const nodeInstalled = fs.existsSync(`/etc/supervisor/conf.d/${coinRec.code}.conf`)
  const walletInstalled = _.isNil(coinRec.wallet)
    ? true
    : fs.existsSync(`/etc/supervisor/conf.d/${coinRec.code}.wallet.conf`)
  return nodeInstalled && walletInstalled
}

function fetchAndInstall (coinRec) {
  const requiresUpdate = isUpdateDependent(coinRec.cryptoCode)
  if (isInstalledSoftware(coinRec)) return

  const binaries = BINARIES[coinRec.cryptoCode]
  if (!binaries) throw new Error(`No such coin: ${coinRec.code}`)

  const url = requiresUpdate ? binaries.defaultUrl : binaries.url
  const downloadFile = path.basename(url)
  const binDir = requiresUpdate ? binaries.defaultDir : binaries.dir

  es(`wget -q ${url}`)
  es(`tar -xf ${downloadFile}`)

  const usrBinDir = isDevMode() ? path.resolve(BLOCKCHAIN_DIR, 'bin') : '/usr/local/bin'

  if (isDevMode()) {
    makeDir.sync(usrBinDir)
  }

  if (_.isEmpty(binaries.files)) {
    es(`sudo cp ${binDir}/* ${usrBinDir}`)
    return
  }

  _.forEach(([source, target]) => {
    es(`sudo cp ${binDir}/${source} ${usrBinDir}/${target}`)
  }, binaries.files)
}

function writeFile (path, content) {
  try {
    fs.writeFileSync(path, content)
  } catch (err) {
    if (err.code === 'EEXIST') {
      logger.info(`${path} exists, skipping.`)
      return
    }

    throw err
  }
}

function getBinaries (coinCode) {
  const binaries = BINARIES[coinCode]
  if (!binaries) throw new Error(`No such coin: ${coinCode}`)
  return binaries
}

function isUpdateDependent (coinCode) {
  return _.includes(coinCode, coinsUpdateDependent)
}
