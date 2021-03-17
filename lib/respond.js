const _ = require('lodash/fp')
const notifier = require('./notifier')

function respond (req, res, _body, _status) {
  const status = _status || 200
  const body = _body || {}
  const customer = _.getOr({ sanctions: true }, ['customer'], body)
  // sanctions can be null for new customers so we can't use falsy checks
  if (customer.sanctions === false) {
    notifier.notifyIfActive('compliance', 'sanctionsNotify', customer, req.body.phone)
  }
  return res.status(status).json(body)
}

module.exports = respond
