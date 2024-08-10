const fs = require('fs')
const os = require('os')
const path = require('path')

const setEnvVariable = require('./set-env-var')

fs.copyFileSync(path.resolve(__dirname, '../.sample.env'), path.resolve(__dirname, '../.env'))

setEnvVariable('NODE_ENV', 'development')

setEnvVariable('POSTGRES_USER', 'postgres')
setEnvVariable('POSTGRES_PASSWORD', 'postgres123')
setEnvVariable('POSTGRES_HOST', 'localhost')
setEnvVariable('POSTGRES_PORT', '5432')
setEnvVariable('POSTGRES_DB', 'lamassu')

setEnvVariable('CA_PATH', `${process.env.PWD}/certs/Lamassu_OP_Root_CA.pem`)
setEnvVariable('CERT_PATH', `${process.env.PWD}/certs/Lamassu_OP.pem`)
setEnvVariable('KEY_PATH', `${process.env.PWD}/certs/Lamassu_OP.key`)

setEnvVariable('MNEMONIC_PATH', `${process.env.HOME}/.lamassu/mnemonics/mnemonic.txt`)

setEnvVariable('BLOCKCHAIN_DIR', `${process.env.PWD}/blockchains`)
setEnvVariable('OFAC_DATA_DIR', `${process.env.HOME}/.lamassu/ofac`)
setEnvVariable('ID_PHOTO_CARD_DIR', `${process.env.HOME}/.lamassu/idphotocard`)
setEnvVariable('FRONT_CAMERA_DIR', `${process.env.HOME}/.lamassu/frontcamera`)
setEnvVariable('OPERATOR_DATA_DIR', `${process.env.HOME}/.lamassu/operatordata`)

setEnvVariable('OFAC_SOURCES_NAMES', 'sdn_advanced,cons_advanced')
setEnvVariable('OFAC_SOURCES_URLS', 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml,https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml')

setEnvVariable('BTC_NODE_LOCATION', 'remote')
setEnvVariable('BTC_WALLET_LOCATION', 'local')

setEnvVariable('HOSTNAME', 'localhost')
setEnvVariable('LOG_LEVEL', 'debug')
