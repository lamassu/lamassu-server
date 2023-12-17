const crypto = require('crypto')
const os = require('os')
const path = require('path')
const cp = require('child_process')
const fs = require('fs')

const _ = require('lodash/fp')

const logger = require('console-log-level')({level: 'info'})

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
    url: 'https://bitcoincore.org/bin/bitcoin-core-26.0/bitcoin-26.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-26.0/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.5-916d6a44.tar.gz',
    dir: 'geth-linux-amd64-1.13.5-916d6a44'
  },
  ZEC: {
    url: 'https://download.z.cash/downloads/zcash-5.7.0-linux64-debian-bullseye.tar.gz',
    dir: 'zcash-5.7.0/bin'
  },
  DASH: {
    defaultUrl: 'https://github.com/dashpay/dash/releases/download/v18.1.0/dashcore-18.1.0-x86_64-linux-gnu.tar.gz',
    defaultDir: 'dashcore-18.1.0/bin',
    url: 'https://github.com/dashpay/dash/releases/download/v20.0.2/dashcore-20.0.2-x86_64-linux-gnu.tar.gz',
    dir: 'dashcore-20.0.2/bin'
  },
  LTC: {
    defaultUrl: 'https://download.litecoin.org/litecoin-0.18.1/linux/litecoin-0.18.1-x86_64-linux-gnu.tar.gz',
    defaultDir: 'litecoin-0.18.1/bin',
    url: 'https://download.litecoin.org/litecoin-0.21.2.2/linux/litecoin-0.21.2.2-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.21.2.2/bin' 
  },
  BCH: {
    url: 'https://github.com/bitcoin-cash-node/bitcoin-cash-node/releases/download/v27.0.0/bitcoin-cash-node-27.0.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-cash-node-27.0.0/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  },
  XMR: {
    url: 'https://downloads.getmonero.org/cli/monero-linux-x64-v0.18.3.1.tar.bz2',
    dir: 'monero-x86_64-linux-gnu-v0.18.3.1',
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

  if (_.isEmpty(binaries.files)) {
    es(`sudo cp ${binDir}/* /usr/local/bin`)
    return
  }

  _.forEach(([source, target]) => {
    es(`sudo cp ${binDir}/${source} /usr/local/bin/${target}`)
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
