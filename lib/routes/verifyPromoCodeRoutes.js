const express = require('express')
const router = express.Router()
const _ = require('lodash/fp')

const BN = require('../bn')
const commissionMath = require('../commission-math')
const configManager = require('../new-config-manager')
const notifier = require('../notifier')
const promoCodes = require('../promo-codes')

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

function verifyPromoCode (req, res, next) {
  promoCodes.getPromoCode(req.body.codeInput)
    .then(promoCode => {
      if (!promoCode) return next()

      const transaction = req.body.tx
      const commissions = configManager.getCommissions(transaction.cryptoCode, req.deviceId, req.settings.config)
      const tickerRate = BN(transaction.rawTickerPrice)
      const discount = commissionMath.getDiscountRate(promoCode.discount, commissions[transaction.direction])
      const rates = {
        [transaction.cryptoCode]: {
          [transaction.direction]: (transaction.direction === 'cashIn')
            ? tickerRate.mul(discount).round(5)
            : tickerRate.div(discount).round(5)
        }
      }

      respond(req, res, {
        promoCode: promoCode,
        newRates: rates
      })
    })
    .catch(next)
}

router.post('/', verifyPromoCode)

module.exports = router
