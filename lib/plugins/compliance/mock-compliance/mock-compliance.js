const uuid = require('uuid')

const {APPROVED} = require('../consts')

const CODE = 'mock-compliance'

const createLink = (settings, userId, level) => {
  return `this is a mock external link, ${userId}, ${level}`
}

const getApplicantStatus = (account, userId) => {
  return Promise.resolve({
    service: CODE,
    status: {
      level: account.applicantLevel, answer: APPROVED
    }
  })
}

const createApplicant = () => {
  return Promise.resolve({
    id: uuid.v4()
  })
}

module.exports = {
  CODE,
  createApplicant,
  getApplicantStatus,
  createLink
}
