const crypto = require('crypto')
const os = require('os')
const path = require('path')
const cp = require('child_process')
const logger = require('console-log-level')({level: 'info'})

module.exports = {es, firewall, randomPass, fetchAndInstall, logger}

const BINARIES = {
  BTC: {
    url: 'https://bitcoin.org/bin/bitcoin-core-0.14.2/bitcoin-0.14.2-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-0.14.2/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.6.6-10a45cb5.tar.gz',
    dir: 'geth-linux-amd64-1.6.6-10a45cb5'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-1.0.10-1-linux64.tar.gz',
    dir: 'zcash-1.0.10-1/bin'
  },
  DASH: {
    url: 'https://www.dash.org/binaries/dashcore-0.12.1.5-linux64.tar.gz',
    dir: 'dashcore-0.12.1/bin'
  },
  LTC: {
    url: 'https://download.litecoin.org/litecoin-0.13.2/linux/litecoin-0.13.2-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.13.2/bin'
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

function fetchAndInstall (crypto) {
  const binaries = BINARIES[crypto.cryptoCode]
  if (!binaries) throw new Error(`No such coin: ${crypto.code}`)

  const url = binaries.url
  const downloadFile = path.basename(url)
  const binDir = binaries.dir

  es(`wget -q ${url}`)
  es(`tar -xzf ${downloadFile}`)
  es(`sudo cp ${binDir}/* /usr/local/bin`)
}
