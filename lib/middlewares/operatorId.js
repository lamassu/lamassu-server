const { getOperatorIdFromDeviceId } = require('../ultralight/queries')

function findOperatorId (req, res, next) {
  return getOperatorIdFromDeviceId(req.deviceId)
    .then(operatorId => {
      res.locals.operatorId = operatorId
      return next()
    })
    .catch(e => {
      console.error('Error while computing operator id\n' + e)
      next(e)
    })
}

module.exports = findOperatorId
