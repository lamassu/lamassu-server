const _ = require('lodash/fp')

const sumsubApi = require('./sumsub.api')
const { PENDING, RETRY, APPROVED, REJECTED } = require('../consts')

const CODE = 'sumsub'

const getApplicantByExternalId = (account, userId) => {
  return sumsubApi.getApplicantByExternalId(account, userId)
    .then(r => r.data)
}

const createApplicant = (account, userId, level) => {
  return sumsubApi.createApplicant(account, userId, level)
    .then(r => r.data)
    .catch(err => {
      if (err.response.status === 409) return getApplicantByExternalId(account, userId)
      throw err
    })
}

const createLink = (account, userId, level) => {
  return sumsubApi.createLink(account, userId, level)
    .then(r => r.data.url)
}

const getApplicantStatus = (account, userId) => {
  return sumsubApi.getApplicantByExternalId(account, userId)
    .then(r => {
      const levelName = _.get('data.review.levelName', r)
      const reviewStatus = _.get('data.review.reviewStatus', r)
      const reviewAnswer = _.get('data.review.reviewResult.reviewAnswer', r)
      const reviewRejectType = _.get('data.review.reviewResult.reviewRejectType', r)

      // if last review was from a different level, return the current level and RETRY
      if (levelName !== account.applicantLevel) return { level: account.applicantLevel, answer: RETRY }

      let answer = PENDING
      if (reviewAnswer === 'GREEN' && reviewStatus === 'completed') answer = APPROVED
      if (reviewAnswer === 'RED' && reviewRejectType === 'RETRY') answer = RETRY
      if (reviewAnswer === 'RED' && reviewRejectType === 'FINAL') answer = REJECTED

      return { level: levelName, answer }
    })
}

module.exports = {
  CODE,
  createApplicant,
  getApplicantStatus,
  createLink
}