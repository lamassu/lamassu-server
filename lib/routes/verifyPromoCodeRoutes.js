const express = require('express')
const router = express.Router()

const BN = require('../bn')
const commissionMath = require('../commission-math')
const configManager = require('../new-config-manager')
const promoCodes = require('../promo-codes')
const respond = require('../respond')

function verifyPromoCode (req, res, next) {
  promoCodes.getPromoCode(req.body.codeInput)
    .then(promoCode => {
      if (!promoCode) return next()

      const transaction = req.body.tx
      const commissions = configManager.getCommissions(transaction.cryptoCode, req.deviceId, req.settings.config)
      const tickerRate = new BN(transaction.rawTickerPrice)
      const discount = commissionMath.getDiscountRate(promoCode.discount, commissions[transaction.direction])
      const rates = {
        [transaction.cryptoCode]: {
          [transaction.direction]: (transaction.direction === 'cashIn')
            ? tickerRate.times(discount).decimalPlaces(5)
            : tickerRate.div(discount).decimalPlaces(5)
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
