const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const isDevMode = () => process.env.NODE_ENV === 'development'
const isProdMode = () => process.env.NODE_ENV === 'production'

module.exports = {
  isDevMode,
  isProdMode
}
