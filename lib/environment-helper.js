const path = require('path')
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? path.resolve('/etc', 'lamassu', '.env') : path.resolve(__dirname, '../.env') })
