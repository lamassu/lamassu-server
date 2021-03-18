const express = require('express')
const argv = require('minimist')(process.argv.slice(2))
const compression = require('compression')
const helmet = require('helmet')
const morgan = require('morgan')
const nocache = require('nocache')

const authorize = require('./middlewares/authorize')
const errorHandler = require('./middlewares/errorHandler')
const filterOldRequests = require('./middlewares/filterOldRequests')
const computeSchema = require('./compute-schema')
const logger = require('./logger')
const options = require('./options')
const findOperatorId = require('./middlewares/operatorId')
const populateDeviceId = require('./middlewares/populateDeviceId')
const populateSettings = require('./middlewares/populateSettings')

const cashboxRoutes = require('./routes/cashboxRoutes')
const customerRoutes = require('./routes/customerRoutes')
const logsRoutes = require('./routes/logsRoutes')
const pairingRoutes = require('./routes/pairingRoutes')
const performanceRoutes = require('./routes/performanceRoutes')
const phoneCodeRoutes = require('./routes/phoneCodeRoutes')
const pollingRoutes = require('./routes/pollingRoutes')
const stateRoutes = require('./routes/stateRoutes')
const termsAndConditionsRoutes = require('./routes/termsAndConditionsRoutes')
const txRoutes = require('./routes/txRoutes')
const verifyUserRoutes = require('./routes/verifyUserRoutes')
const verifyTxRoutes = require('./routes/verifyTxRoutes')
const verifyPromoCodeRoutes = require('./routes/verifyPromoCodeRoutes')

const localAppRoutes = require('./routes/localAppRoutes')

const app = express()
const localApp = express()

const configRequiredRoutes = [
  '/poll',
  '/terms_conditions',
  '/event',
  '/phone_code',
  '/customer',
  '/tx',
  '/verify_promo_code'
]
const devMode = argv.dev || options.http

// middleware setup
app.use(compression({ threshold: 500 }))
app.use(helmet())
app.use(nocache())
app.use(express.json({ limit: '2mb' }))
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', { stream: logger.stream }))

// app /pair and /ca routes
app.use('/', pairingRoutes)

app.use(findOperatorId)
app.use(populateDeviceId)
app.use(computeSchema)
if (!devMode) app.use(authorize)
app.use(configRequiredRoutes, populateSettings)
app.use(filterOldRequests)

// other app routes
app.use('/poll', pollingRoutes)
app.use('/terms_conditions', termsAndConditionsRoutes)
app.use('/state', stateRoutes)
app.use('/cashbox', cashboxRoutes)

app.use('/network', performanceRoutes)

app.use('/verify_user', verifyUserRoutes)
app.use('/verify_transaction', verifyTxRoutes)
app.use('/verify_promo_code', verifyPromoCodeRoutes)

app.use('/phone_code', phoneCodeRoutes)
app.use('/customer', customerRoutes)

app.use('/tx', txRoutes)

app.use('/logs', logsRoutes)

app.use(errorHandler)
app.use((req, res) => {
  res.status(404).json({ error: 'No such route' })
})

// localapp routes
localApp.use('/', localAppRoutes)

module.exports = { app, localApp }
