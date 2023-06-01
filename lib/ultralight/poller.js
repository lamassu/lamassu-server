const _ = require('lodash/fp')
require('../environment-helper')

const lamassuPoller = require('../poller')
const { getSchemas } = require('./queries.js')

const REFRESH_SCHEMAS_INTERVAL = 10 * 1000 // 10 seconds

const makeObjFromArray = arr => _.reduce((acc, elem) => ({ ...acc, [elem]: '' }), {}, arr)

const separateSchemas = (dbSchemas, pollerSchemas) => {
  const dbSchemasMap = makeObjFromArray(dbSchemas)
  const pollerSchemasMap = makeObjFromArray(pollerSchemas)
  const toAdd = _.filter(schema => !_.has(schema, pollerSchemasMap), dbSchemas)
  const toRemove = _.filter(schema => !_.has(schema, dbSchemasMap), pollerSchemas)
  return [toAdd, toRemove]
}

const pazuzPoller_ = async () => {
  try {
    const dbSchemas = await getSchemas()
    const [toAdd, toRemove] = separateSchemas(dbSchemas, lamassuPoller.getActiveSchemas())
    if (toAdd.length > 0 || toRemove.length > 0) {
      return lamassuPoller.setup(toAdd, toRemove)
    }
    return null
  } catch (err) {
    console.error(err)
  }
}

const pazuzPoller = () => {
  pazuzPoller_()
  return setInterval(() => {
    return pazuzPoller_()
  }, REFRESH_SCHEMAS_INTERVAL)
}

pazuzPoller()