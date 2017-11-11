const crypto = require('crypto')
const os = require('os')
const path = require('path')
const cp = require('child_process')
const fs = require('fs')
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
    url: 'https://bitcoin.org/bin/bitcoin-core-0.14.2/bitcoin-0.14.2-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-0.14.2/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.2-1db4ecdc.tar.gz',
    dir: 'geth-linux-amd64-1.7.2-1db4ecdc'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-1.0.12-linux64.tar.gz',
    dir: 'zcash-1.0.12/bin'
  },
  DASH: {
    url: 'https://www.dash.org/binaries/dashcore-0.12.1.5-linux64.tar.gz',
    dir: 'dashcore-0.12.1/bin'
  },
  LTC: {
    url: 'https://download.litecoin.org/litecoin-0.13.2/linux/litecoin-0.13.2-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.13.2/bin'
  },
  BCH: {
    url: 'https://download.bitcoinabc.org/0.16.0/linux/bitcoin-abc-0.16.0-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-abc-0.16.0/bin'
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
  es(`sudo cp ${binDir}/* /usr/local/bin`)
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
