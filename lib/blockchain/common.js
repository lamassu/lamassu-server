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
    defaultUrl: 'https://bitcoincore.org/bin/bitcoin-core-0.20.0/bitcoin-0.20.0-x86_64-linux-gnu.tar.gz',
    defaultDir: 'bitcoin-0.20.0/bin',
    url: 'https://bitcoincore.org/bin/bitcoin-core-22.0/bitcoin-22.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-22.0/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.10.12-6c4dc6c3.tar.gz',
    dir: 'geth-linux-amd64-1.10.12-6c4dc6c3'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-4.5.1-1-linux64-debian-stretch.tar.gz',
    dir: 'zcash-4.5.1-1/bin'
  },
  DASH: {
    url: 'https://github.com/dashpay/dash/releases/download/v0.17.0.3/dashcore-0.17.0.3-x86_64-linux-gnu.tar.gz',
    dir: 'dashcore-0.17.0/bin'
  },
  LTC: {
    url: 'https://download.litecoin.org/litecoin-0.18.1/linux/litecoin-0.18.1-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.18.1/bin'
  },
  BCH: {
    url: 'https://github.com/bitcoin-cash-node/bitcoin-cash-node/releases/download/v23.1.0/bitcoin-cash-node-23.1.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-cash-node-23.1.0/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  }
}

const coinsUpdateDependent = ['BTC']

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

function writeSupervisorConfig (coinRec, cmd) {
  if (isInstalledSoftware(coinRec)) return

  const blockchain = coinRec.code

  const supervisorConfig = `[program:${blockchain}]
command=nice ${cmd}
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/${blockchain}.err.log
stdout_logfile=/var/log/supervisor/${blockchain}.out.log
stderr_logfile_backups=2
stdout_logfile_backups=2
environment=HOME="/root"
`

  writeFile(`/etc/supervisor/conf.d/${coinRec.code}.conf`, supervisorConfig)
}

function isInstalledSoftware (coinRec) {
  return fs.existsSync(`/etc/supervisor/conf.d/${coinRec.code}.conf`)
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
  es(`tar -xzf ${downloadFile}`)

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
