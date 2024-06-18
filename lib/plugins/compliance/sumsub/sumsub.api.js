const request = require('./request')

const createApplicant = (account, userId, level) => {
  if (!userId || !level) {
    return Promise.reject(`Missing required fields: userId: ${userId}, level: ${level}`)
  }

  const config = {
    method: 'POST',
    url: `/resources/applicants?levelName=${level}`,
    data: {
      externalUserId: userId,
      sourceKey: 'lamassu'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  return request(account, config)
}

const createLink = (account, userId, level) => {
  if (!userId || !level) {
    return Promise.reject(`Missing required fields: userId: ${userId}, level: ${level}`)
  }

  const config = {
    method: 'POST',
    url: `/resources/sdkIntegrations/levels/${level}/websdkLink?ttlInSecs=${600}&externalUserId=${userId}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  return request(account, config)
}

const getApplicantByExternalId = (account, id) => {
  if (!id) {
    return Promise.reject('Missing required fields: id')
  }

  const config = {
    method: 'GET',
    url: `/resources/applicants/-;externalUserId=${id}/one`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  return request(account, config)
}

const getApplicantStatus = (account, id) => {
  if (!id) {
    return Promise.reject(`Missing required fields: id`)
  }

  const config = {
    method: 'GET',
    url: `/resources/applicants/${id}/status`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  return request(account, config)
}

const getApplicantById = (account, id) => {
  if (!id) {
    return Promise.reject(`Missing required fields: id`)
  }

  const config = {
    method: 'GET',
    url: `/resources/applicants/${id}/one`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  return request(account, config)
}

module.exports = {
  createLink,
  createApplicant,
  getApplicantByExternalId,
  getApplicantById,
  getApplicantStatus
}
