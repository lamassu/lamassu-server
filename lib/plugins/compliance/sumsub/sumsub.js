const _ = require('lodash/fp')

const request = require('./request')

const CODE = 'sumsub'

const hasRequiredFields = fields => obj => _.every(_.partial(_.has, [_, obj]), fields)
const getMissingRequiredFields = (fields, obj) =>
  _.reduce(
    (acc, value) => {
      if (!_.has(value, obj)) {
        acc.push(value)
      }
      return acc
    },
    [],
    fields
  )

const createApplicantExternalLink = opts => {
  const REQUIRED_FIELDS = ['userId', 'levelName']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/sdkIntegrations/levels/${opts.levelName}/websdkLink?ttlInSecs=${600}&externalUserId=${opts.userId}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
}

const createApplicant = opts => {
  const REQUIRED_FIELDS = ['levelName', 'externalUserId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants?levelName=${opts.levelName}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      externalUserId: opts.externalUserId
    }
  })
}

const changeRequiredLevel = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'levelName']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/moveToLevel?name=${opts.levelName}`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

const getApplicant = (opts, knowsApplicantId = true) => {
  const REQUIRED_FIELDS = knowsApplicantId
    ? ['applicantId']
    : ['externalUserId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'GET',
    url: knowsApplicantId ? `/resources/applicants/${opts.applicantId}/one` : `/resources/applicants/-;externalUserId=${opts.externalUserId}/one`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const getApplicantStatus = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'GET',
    url: `/resources/applicants/${opts.applicantId}/status`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const getApplicantIdDocsStatus = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'GET',
    url: `/resources/applicants/${opts.applicantId}/requiredIdDocsStatus`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const addIdDocument = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'metadata', 'metadata.idDocType', 'metadata.country']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  const form = new FormData()
  form.append('metadata', opts.metadata)
  form.append('content', opts.content)

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/info/idDoc`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
      'X-Return-Doc-Warnings': 'true'
    },
    data: form
  })
}

const changeApplicantFixedInfo = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'newData']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'PATCH',
    url: `/resources/applicants/${opts.applicantId}/fixedInfo`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    data: opts.newData
  })
}

const getApplicantRejectReasons = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'GET',
    url: `/resources/moderationStates/-;applicantId=${opts.applicantId}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const requestApplicantCheck = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/status/pending${!_.isNil(opts.reason) ? `?reason=${opts.reason}` : ``}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const requestApplicantCheckDiffVerificationType = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'reasonCode']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/status/pending${!_.isNil(opts.reasonCode) ? `?reasonCode=${opts.reasonCode}` : ``}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const getDocumentImages = opts => {
  const REQUIRED_FIELDS = ['inspectionId', 'imageId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'GET',
    url: `/resources/inspections/${opts.inspectionId}/resources/${opts.imageId}`,
    headers: {
      'Accept': 'image/jpeg, image/png, application/pdf, video/mp4, video/webm, video/quicktime',
      'Content-Type': 'application/json'
    }
  })
}

const blockApplicant = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'note']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/blacklist?note=${opts.note}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const generateShareToken = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'clientId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/accessTokens/-/shareToken?applicantId=${opts.applicantId}&forClientId=${opts.clientId}${!_.isNil(opts.ttlInSecs) ? `&ttlInSecs=${opts.ttlInSecs}` : ``}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const importRawApplicant = opts => {
  const REQUIRED_FIELDS = ['applicantObj']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/-/ingestCompleted`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    data: opts.applicantObj
  })
}

const importApplicantFromPartnerService = opts => {
  const REQUIRED_FIELDS = ['shareToken']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/-/import?shareToken=${opts.shareToken}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const resetVerificationStep = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'idDocSetType']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/resetStep/${opts.idDocSetType}`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const resetApplicant = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/reset`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

const patchApplicantTopLevelInfo = opts => {
  const REQUIRED_FIELDS = ['applicantId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    data: {
      id: opts.applicantId,
      externalUserId: opts.externalUserId,
      email: opts.email,
      phone: opts.phone,
      sourceKey: opts.sourceKey,
      type: opts.type,
      lang: opts.lang,
      questionnaires: opts.questionnaires,
      metadata: opts.metadata,
      deleted: opts.deleted
    }
  })
}

const setApplicantRiskLevel = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'comment', 'riskLevel']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/riskLevel/entries`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      comment: opts.comment,
      riskLevel: opts.riskLevel
    }
  })
}

const addApplicantTags = opts => {
  const REQUIRED_FIELDS = ['applicantId', 'tags']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'POST',
    url: `/resources/applicants/${opts.applicantId}/tags`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: opts.tags
  })
}

const markImageAsInactive = opts => {
  const REQUIRED_FIELDS = ['inspectionId', 'imageId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'DELETE',
    url: `/resources/inspections/${opts.inspectionId}/resources/${opts.imageId}?revert=false`
  })
}

const markImageAsActive = opts => {
  const REQUIRED_FIELDS = ['inspectionId', 'imageId']

  if (_.isEmpty(opts) || !hasRequiredFields(REQUIRED_FIELDS, opts)) {
    return Promise.reject(`Missing required fields: ${getMissingRequiredFields(REQUIRED_FIELDS, opts)}`)
  }

  return request({
    method: 'DELETE',
    url: `/resources/inspections/${opts.inspectionId}/resources/${opts.imageId}?revert=true`
  })
}

const getApiHealth = () => {
  return request({
    method: 'GET',
    url: `/resources/status/api`
  })
}

module.exports = {
  CODE,
  createApplicantExternalLink,
  createApplicant,
  getApplicant,
  addIdDocument,
  changeApplicantFixedInfo,
  getApplicantStatus,
  getApplicantIdDocsStatus,
  getApplicantRejectReasons,
  requestApplicantCheck,
  requestApplicantCheckDiffVerificationType,
  getDocumentImages,
  blockApplicant,
  generateShareToken,
  importRawApplicant,
  importApplicantFromPartnerService,
  resetVerificationStep,
  resetApplicant,
  patchApplicantTopLevelInfo,
  setApplicantRiskLevel,
  addApplicantTags,
  markImageAsInactive,
  markImageAsActive,
  getApiHealth,
  changeRequiredLevel
}
