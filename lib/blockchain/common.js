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
    defaultUrlHash: '376194f06596ecfa40331167c39bc70c355f960280bd2a645fdbf18f66527397',
    defaultDir: 'bitcoin-0.20.1/bin',
    url: 'https://bitcoincore.org/bin/bitcoin-core-23.0/bitcoin-23.0-x86_64-linux-gnu.tar.gz',
    urlHash: '2cca490c1f2842884a3c5b0606f179f9f937177da4eadd628e3f7fd7e25d26d0',
    dir: 'bitcoin-23.0/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.10.26-e5eb32ac.tar.gz',
    urlHash: '86156f29bd9e36af69a01450fd711dd2704bbc379c6995795a749f6799c9d56a',
    dir: 'geth-linux-amd64-1.10.26-e5eb32ac'
  },
  DASH: {
    url: 'https://github.com/dashpay/dash/releases/download/v18.1.0/dashcore-18.1.0-x86_64-linux-gnu.tar.gz',
    urlHash: 'd89c2afd78183f3ee815adcccdff02098be0c982633889e7b1e9c9656fbef219',
    dir: 'dashcore-18.1.0/bin'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-5.3.2-linux64-debian-bullseye.tar.gz',
    urlHash: '20b0aa39b72826fe5c2d967151ce8cccbd11c1cf1b6c2adf8ddad0c596e241fc',
    dir: 'zcash-5.3.2/bin'
  },
  LTC: {
    defaultUrl: 'https://download.litecoin.org/litecoin-0.18.1/linux/litecoin-0.18.1-x86_64-linux-gnu.tar.gz',
    defaultUrlHash: 'ca50936299e2c5a66b954c266dcaaeef9e91b2f5307069b9894048acf3eb5751',
    defaultDir: 'litecoin-0.18.1/bin',
    url: 'https://download.litecoin.org/litecoin-0.21.2.1/linux/litecoin-0.21.2.1-x86_64-linux-gnu.tar.gz',
    urlHash: '6e545d1ef0842b9c4ecaf2e22b43f17fd3fba73599b0d6cc1db0c9310f1a74ff',
    dir: 'litecoin-0.21.2.1/bin'
  },
  BCH: {
    url: 'https://github.com/bitcoin-cash-node/bitcoin-cash-node/releases/download/v26.0.0/bitcoin-cash-node-26.0.0-x86_64-linux-gnu.tar.gz',
    urlHash: 'e32e05fd63161f6f1fe717fca789448d2ee48e2017d3d4c6686b4222fe69497e',
    dir: 'bitcoin-cash-node-25.0.0/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  },
  XMR: {
    url: 'https://downloads.getmonero.org/cli/monero-linux-x64-v0.18.1.2.tar.bz2',
    urlHash: '7d51e7072351f65d0c7909e745827cfd3b00abe5e7c4cc4c104a3c9b526da07e',
    dir: 'monero-x86_64-linux-gnu-v0.18.1.2',
    files: [['monerod', 'monerod'], ['monero-wallet-rpc', 'monero-wallet-rpc']]
  }
}

const coinsUpdateDependent = ['BTC', 'LTC']

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
  const hash = requiresUpdate ? binaries.defaultUrlHash : binaries.urlHash
  const downloadFile = path.basename(url)
  const binDir = requiresUpdate ? binaries.defaultDir : binaries.dir

  es(`wget -q ${url}`)
  if (es(`sha256sum ${downloadFile} | awk '{print $1}'`).trim() !== hash) {
    logger.info(`Failed to install ${coinRec.code}: Package signature do not match!`)
    return
  }
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
