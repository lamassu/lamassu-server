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
  writeFile
}

const BINARIES = {
  BTC: {
    url: 'https://bitcoin.org/bin/bitcoin-core-0.18.0/bitcoin-0.18.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-0.18.0/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.9.1-b7b2f60f.tar.gz',
    dir: 'geth-linux-amd64-1.9.1-b7b2f60f'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-2.0.6-linux64.tar.gz',
    dir: 'zcash-2.0.6/bin'
  },
  DASH: {
    url: 'https://github.com/dashpay/dash/releases/download/v0.14.0.2/dashcore-0.14.0.2-x86_64-linux-gnu.tar',
    dir: 'dashcore-0.14.0/bin'
  },
  LTC: {
    url: 'https://download.litecoin.org/litecoin-0.17.1/linux/litecoin-0.17.1-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.17.1/bin'
  },
  BCH: {
    url: 'https://download.bitcoinabc.org/0.19.10/linux/bitcoin-abc-0.19.10-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-abc-0.19.10/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  }
}

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
environment=HOME="/root"
`

  writeFile(`/etc/supervisor/conf.d/${coinRec.code}.conf`, supervisorConfig)
}

function isInstalledSoftware (coinRec) {
  return fs.existsSync(`/etc/supervisor/conf.d/${coinRec.code}.conf`)
}

function fetchAndInstall (coinRec) {
  if (isInstalledSoftware(coinRec)) return

  const binaries = BINARIES[coinRec.cryptoCode]
  if (!binaries) throw new Error(`No such coin: ${coinRec.code}`)

  const url = binaries.url
  const downloadFile = path.basename(url)
  const binDir = binaries.dir

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
