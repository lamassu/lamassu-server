const fs = require('fs')
const os = require('os')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const _ = require('lodash/fp')

const setEnvVariable = require('./set-env-var')

const requiredParams = ['db-password', 'hostname']

if (!_.isEqual(_.intersection(_.keys(argv), requiredParams), requiredParams)) {
  console.error('Usage: node tools/build-prod-env.js --db-password <DB_PASSWORD> --hostname <IP>')
  process.exit(2)
}

fs.copyFileSync(path.resolve(__dirname, '../.sample.env'), process.env.NODE_ENV === 'production' ? path.resolve(os.homedir(), '.lamassu', '.env') : path.resolve(__dirname, '../.env'))

setEnvVariable('POSTGRES_USER', 'lamassu_pg')
setEnvVariable('POSTGRES_PASSWORD', `${argv['db-password']}`)
setEnvVariable('POSTGRES_HOST', 'localhost')
setEnvVariable('POSTGRES_PORT', '5432')
setEnvVariable('POSTGRES_DB', 'lamassu')

setEnvVariable('LAMASSU_CA_PATH', `/etc/ssl/certs/Lamassu_CA.pem`)
setEnvVariable('CA_PATH', `/etc/ssl/certs/Lamassu_OP_Root_CA.pem`)
setEnvVariable('CERT_PATH', `/etc/ssl/certs/Lamassu_OP.pem`)
setEnvVariable('KEY_PATH', `/etc/ssl/certs/Lamassu_OP.key`)

setEnvVariable('MNEMONIC_PATH', `/etc/lamassu/mnemonics/mnemonic.txt`)
setEnvVariable('MIGRATE_STATE_PATH', `/etc/lamassu/.migrate`)

setEnvVariable('BLOCKCHAIN_DIR', `/mnt/blockchains`)
setEnvVariable('OFAC_DATA_DIR', `/var/lamassu/ofac`)
setEnvVariable('ID_PHOTO_CARD_DIR', `/opt/lamassu-server/idphotocard`)
setEnvVariable('FRONT_CAMERA_DIR', `/opt/lamassu-server/frontcamera`)
setEnvVariable('OPERATOR_DATA_DIR', `/opt/lamassu-server/operatordata`)

setEnvVariable('STRIKE_BASE_URL', `https://api.strike.acinq.co/api/`)
setEnvVariable('COIN_ATM_RADAR_URL', `https://coinatmradar.info/api/lamassu/`)

setEnvVariable('OFAC_SOURCES_NAMES', 'sdn_advanced,cons_advanced')
setEnvVariable('OFAC_SOURCES_URLS', 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml,https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml')

setEnvVariable('HOSTNAME', `${argv.hostname}`)
setEnvVariable('LOG_LEVEL', 'info')
