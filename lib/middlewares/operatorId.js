const { getOperatorId } = require('../operator')

function findOperatorId (req, res, next) {
  return getOperatorId('middleware')
    .then(({ operatorId }) => {
      res.locals.operatorId = operatorId
      return next()
    })
    .catch(e => {
      console.error('Error while computing operator id\n' + e)
      next(e)
    })
}

module.exports = findOperatorId
