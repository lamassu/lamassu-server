const express = require('express')
const router = express.Router()
const _ = require('lodash/fp')

const dbErrorCodes = require('../db-error-codes')
const E = require('../error')
const helpers = require('../route-helpers')
const httpError = require('../route-helpers').httpError
const logger = require('../logger')
const plugins = require('../plugins')
const Tx = require('../tx')

function postTx (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)

  return Tx.post(_.set('deviceId', req.deviceId, req.body), pi)
    .then(tx => {
      if (tx.errorCode) {
        logger.error(tx.error)
        switch (tx.errorCode) {
          case 'InsufficientFundsError':
            throw httpError(tx.error, 570)
          default:
            throw httpError(tx.error, 500)
        }
      }

      return res.json(tx)
    })
    .catch(err => {
      // 204 so that l-m can ignore the error
      // this is fine because the request is polled and will be retried if needed.
      if (err.code === dbErrorCodes.SERIALIZATION_FAILURE) {
        logger.warn('Harmless DB conflict, the query will be retried.')
        return res.status(204).json({})
      }
      if (err instanceof E.StaleTxError) return res.status(409).json({ errorType: 'stale' })
      if (err instanceof E.RatchetError) return res.status(409).json({ errorType: 'ratchet' })

      throw err
    })
    .catch(next)
}

function getTx (req, res, next) {
  if (req.query.status) {
    return helpers.fetchStatusTx(req.params.id, req.query.status)
      .then(r => res.json(r))
      .catch(next)
  }

  return next(httpError('Not Found', 404))
}

function getPhoneTx (req, res, next) {
  if (req.query.phone) {
    return helpers.fetchPhoneTx(req.query.phone)
      .then(r => res.json(r))
      .catch(next)
  }

  return next(httpError('Not Found', 404))
}

router.post('/', postTx)
router.get('/:id', getTx)
router.get('/', getPhoneTx)

module.exports = { postTx, getTx, getPhoneTx, router }
