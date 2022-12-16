const path = require('path')

const isDevMode = () => process.env.NODE_ENV === 'development'
const isProdMode = () => process.env.NODE_ENV === 'production'

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

function isRemoteNode (crypto) {
  return process.env[`${crypto.cryptoCode}_NODE_LOCATION`] === 'remote'
}

function isRemoteWallet (crypto) {
  return process.env[`${crypto.cryptoCode}_WALLET_LOCATION`] === 'remote'
}

module.exports = {
  isDevMode,
  isProdMode,
  isRemoteNode,
  isRemoteWallet
}
