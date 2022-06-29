const path = require('path')

const isDevMode = () => process.env.NODE_ENV === 'development'
const isProdMode = () => process.env.NODE_ENV === 'production'

require('dotenv').config({ path: isProdMode() ? path.resolve('/etc', 'lamassu', '.env') : path.resolve(__dirname, '../.env') })

module.exports = {
  isDevMode,
  isProdMode
}
