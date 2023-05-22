const { asyncLocalStorage, defaultStore } = require('../async-storage')
const { getSchemaFromDeviceId } = require('../ultralight/queries')

const computeSchema = (req, res, next) => {
  const store = defaultStore()
  asyncLocalStorage.run(store, async () => {
    try {
      const schema = await getSchemaFromDeviceId(req.deviceId)
      store.set('schema', schema)
      next()
    } catch (err) {
      return next(err)
    }
  })
}

module.exports = computeSchema
