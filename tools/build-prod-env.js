const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const _ = require('lodash/fp')

const setEnvVariable = require('./set-env-var')

const requiredParams = ['db-password', 'hostname']

if (!_.isEqual(_.intersection(_.keys(argv), requiredParams), requiredParams)) {
  console.error('Usage: node tools/build-prod-env.js --db-password <DB_PASSWORD> --hostname <IP>')
  process.exit(2)
}

fs.copyFileSync(path.resolve(__dirname, '../.sample.env'), path.resolve('/etc', 'lamassu', '.env'))

setEnvVariable('NODE_ENV', 'production')

setEnvVariable('POSTGRES_USER', 'lamassu_pg')
setEnvVariable('POSTGRES_PASSWORD', `${argv['db-password']}`)
setEnvVariable('POSTGRES_HOST', 'localhost')
setEnvVariable('POSTGRES_PORT', '5432')
setEnvVariable('POSTGRES_DB', 'lamassu')

setEnvVariable('CA_PATH', `/etc/ssl/certs/Lamassu_OP_Root_CA.pem`)
setEnvVariable('CERT_PATH', `/etc/ssl/certs/Lamassu_OP.pem`)
setEnvVariable('KEY_PATH', `/etc/ssl/private/Lamassu_OP.key`)

setEnvVariable('MNEMONIC_PATH', `/etc/lamassu/mnemonics/mnemonic.txt`)

setEnvVariable('BLOCKCHAIN_DIR', `/mnt/blockchains`)
setEnvVariable('OFAC_DATA_DIR', `/var/lamassu/ofac`)
setEnvVariable('ID_PHOTO_CARD_DIR', `/opt/lamassu-server/idphotocard`)
setEnvVariable('FRONT_CAMERA_DIR', `/opt/lamassu-server/frontcamera`)
setEnvVariable('OPERATOR_DATA_DIR', `/opt/lamassu-server/operatordata`)

setEnvVariable('COIN_ATM_RADAR_URL', `https://coinatmradar.info/api/lamassu/`)

setEnvVariable('OFAC_SOURCES_NAMES', 'sdn_advanced,cons_advanced')
setEnvVariable('OFAC_SOURCES_URLS', 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml,https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml')

setEnvVariable('BTC_NODE_LOCATION', 'local')
setEnvVariable('BTC_WALLET_LOCATION', 'local')
setEnvVariable('BCH_NODE_LOCATION', 'local')
setEnvVariable('BCH_WALLET_LOCATION', 'local')
setEnvVariable('LTC_NODE_LOCATION', 'local')
setEnvVariable('LTC_WALLET_LOCATION', 'local')
setEnvVariable('DASH_NODE_LOCATION', 'local')
setEnvVariable('DASH_WALLET_LOCATION', 'local')
setEnvVariable('ZEC_NODE_LOCATION', 'local')
setEnvVariable('ZEC_WALLET_LOCATION', 'local')
setEnvVariable('XMR_NODE_LOCATION', 'local')
setEnvVariable('XMR_WALLET_LOCATION', 'local')

setEnvVariable('HOSTNAME', `${argv.hostname}`)
setEnvVariable('LOG_LEVEL', 'info')
