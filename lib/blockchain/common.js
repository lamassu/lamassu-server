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
    url: 'https://bitcoin.org/bin/bitcoin-core-0.18.1/bitcoin-0.18.1-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-0.18.1/bin'
  },
  ETH: {
    url: 'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.9.3-cfbb969d.tar.gz',
    dir: 'geth-linux-amd64-1.9.3-cfbb969d'
  },
  ZEC: {
    url: 'https://z.cash/downloads/zcash-2.0.7-3-linux64-debian-jessie.tar.gz',
    dir: 'zcash-2.0.7-3/bin'
  },
  DASH: {
    url: 'https://github.com/dashpay/dash/releases/download/v0.14.0.3/dashcore-0.14.0.3-x86_64-linux-gnu.tar.gz',
    dir: 'dashcore-0.14.0/bin'
  },
  LTC: {
    url: 'https://download.litecoin.org/litecoin-0.17.1/linux/litecoin-0.17.1-x86_64-linux-gnu.tar.gz',
    dir: 'litecoin-0.17.1/bin'
  },
  BCH: {
    url: 'https://download.bitcoinabc.org/0.20.2/linux/bitcoin-abc-0.20.2-x86_64-linux-gnu.tar.gz',
    dir: 'bitcoin-abc-0.20.2/bin',
    files: [['bitcoind', 'bitcoincashd'], ['bitcoin-cli', 'bitcoincash-cli']]
  },
  ADA: {
    url: 'http://206.189.68.135:8000/cardano-node.tar.gz',
    dir: 'cardano-node-3.1.0',
    files: [['cardano-node', 'cardano-node']],
    directories: [
      ['glibc-2.27', '/usr/local/glibc-2.27'],
      ['libraries', '/usr/local/lib'],
      ['cardano-node-binary', '/usr/local/cardano-node-binary']
    ]
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

function fetchAndInstall (coinRec, tmpDir) {
  if (isInstalledSoftware(coinRec)) return

  const binaries = BINARIES[coinRec.cryptoCode]
  if (!binaries) throw new Error(`No such coin: ${coinRec.code}`)

  const url = binaries.url
  const downloadFile = path.basename(url)
  const binDir = binaries.dir

  es(`wget -q ${url}`)
  es(`tar -xzf ${downloadFile}`)

  if (binaries.buildCmd) {
    try {
      es(`${__dirname}/${binaries.buildCmd} \`realpath ${binDir}\` >output 2>&1`)
    } catch (e) {
      logger.error('Error occured when building binaries')
      if (fs.existsSync(`${tmpDir}/output`)) {
        logger.info('LOG:')
        logger.info(fs.readFileSync(`${tmpDir}/output`, 'utf8'))
      }

      throw e
    }
  }

  if (_.isEmpty(binaries.files)) {
    es(`sudo cp ${binDir}/* /usr/local/bin`)
  } else {
    _.forEach(([source, target]) => {
      es(`sudo cp ${binDir}/${source} /usr/local/bin/${target}`)
    }, binaries.files)
  }

  if (!_.isEmpty(binaries.directories)) {
    _.forEach(([source, target]) => {
      es(`sudo mkdir -p ${target}`);
      es(`sudo cp -rf ${binDir}/${source}/* ${target}`)
    }, binaries.directories)
  }
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
