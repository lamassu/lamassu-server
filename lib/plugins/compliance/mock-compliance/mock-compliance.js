const CODE = 'mock-compliance'

const createLink = (settings, userId, level) => {
  return `this is a mock external link, ${userId}, ${level}`
}

const getApplicantStatus = (settings, userId) => {
}

module.exports = {
  CODE,
  createLink,
  getApplicantStatus
}
