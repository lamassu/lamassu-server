const ADD_ID_DOCUMENT_WARNINGS = {
  badSelfie: 'Make sure that your face and the photo in the document are clearly visible',
  dataReadability: 'Please make sure that the information in the document is easy to read',
  inconsistentDocument: 'Please ensure that all uploaded photos are of the same document',
  maybeExpiredDoc: 'Your document appears to be expired',
  documentTooMuchOutside: 'Please ensure that the document completely fits the photo'
}

const ADD_ID_DOCUMENT_ERRORS = {
  forbiddenDocument: 'Unsupported or unacceptable type/country of document',
  differentDocTypeOrCountry: 'Document type or country mismatches ones that was sent with metadata',
  missingImportantInfo: 'Not all required document data can be recognized',
  dataNotReadable: 'There is no available data to recognize from image',
  expiredDoc: 'Document validity date is expired',
  documentWayTooMuchOutside: 'Not all parts of the documents are visible',
  grayscale: 'Black and white image',
  noIdDocFacePhoto: 'Face is not clearly visible on the document',
  selfieFaceBadQuality: 'Face is not clearly visible on the selfie',
  screenRecapture: 'Image might be a photo of screen',
  screenshot: 'Image is a screenshot',
  sameSides: 'Image of the same side of document was uploaded as front and back sides',
  shouldBeMrzDocument: 'Sent document type should have an MRZ, but there is no readable MRZ on the image',
  shouldBeDoubleSided: 'Two sides of the sent document should be presented',
  shouldBeDoublePaged: 'The full double-page of the document are required',
  documentDeclinedBefore: 'The same image was uploaded and declined earlier'
}

const SUPPORTED_DOCUMENT_TYPES = {
  ID_CARD: {
    code: 'ID_CARD',
    description: 'An ID card'
  },
  PASSPORT: {
    code: 'PASSPORT',
    description: 'A passport'
  },
  DRIVERS: {
    code: 'DRIVERS',
    description: 'A driving license'
  },
  RESIDENCE_PERMIT: {
    code: 'RESIDENCE_PERMIT',
    description: 'Residence permit or registration document in the foreign city/country'
  },
  UTILITY_BILL: {
    code: 'UTILITY_BILL',
    description: 'Proof of address document'
  },
  SELFIE: {
    code: 'SELFIE',
    description: 'A selfie with a document'
  },
  VIDEO_SELFIE: {
    code: 'VIDEO_SELFIE',
    description: 'A selfie video'
  },
  PROFILE_IMAGE: {
    code: 'PROFILE_IMAGE',
    description: 'A profile image, i.e. avatar'
  },
  ID_DOC_PHOTO: {
    code: 'ID_DOC_PHOTO',
    description: 'Photo from an ID doc (like a photo from a passport)'
  },
  AGREEMENT: {
    code: 'AGREEMENT',
    description: 'Agreement of some sort, e.g. for processing personal info'
  },
  CONTRACT: {
    code: 'CONTRACT',
    description: 'Some sort of contract'
  },
  DRIVERS_TRANSLATION: {
    code: 'DRIVERS_TRANSLATION',
    description: 'Translation of the driving license required in the target country'
  },
  INVESTOR_DOC: {
    code: 'INVESTOR_DOC',
    description: 'A document from an investor, e.g. documents which disclose assets of the investor'
  },
  VEHICLE_REGISTRATION_CERTIFICATE: {
    code: 'VEHICLE_REGISTRATION_CERTIFICATE',
    description: 'Certificate of vehicle registration'
  },
  INCOME_SOURCE: {
    code: 'INCOME_SOURCE',
    description: 'A proof of income'
  },
  PAYMENT_METHOD: {
    code: 'PAYMENT_METHOD',
    description: 'Entity confirming payment (like bank card, crypto wallet, etc)'
  },
  BANK_CARD: {
    code: 'BANK_CARD',
    description: 'A bank card, like Visa or Maestro'
  },
  COVID_VACCINATION_FORM: {
    code: 'COVID_VACCINATION_FORM',
    description: 'COVID vaccination document'
  },
  OTHER: {
    code: 'OTHER',
    description: 'Should be used only when nothing else applies'
  },
}

const VERIFICATION_RESULTS = {
  GREEN: {
    code: 'GREEN',
    description: 'Everything is fine'
  },
  RED: {
    code: 'RED',
    description: 'Some violations found'
  }
}

const REVIEW_REJECT_TYPES = {
  FINAL: {
    code: 'FINAL',
    description: 'Final reject, e.g. when a person is a fraudster, or a client does not want to accept such kinds of clients in their system'
  },
  RETRY: {
    code: 'RETRY',
    description: 'Decline that can be fixed, e.g. by uploading an image of better quality'
  }
}

const REVIEW_REJECT_LABELS = {
  FORGERY: {
    code: 'FORGERY',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Forgery attempt has been made'
  },
  DOCUMENT_TEMPLATE: {
    code: 'DOCUMENT_TEMPLATE',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Documents supplied are templates, downloaded from internet'
  },
  LOW_QUALITY: {
    code: 'LOW_QUALITY',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Documents have low-quality that does not allow definitive conclusions to be made'
  },
  SPAM: {
    code: 'SPAM',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'An applicant has been created by mistake or is just a spam user (irrelevant images were supplied)'
  },
  NOT_DOCUMENT: {
    code: 'NOT_DOCUMENT',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Documents supplied are not relevant for the verification procedure'
  },
  SELFIE_MISMATCH: {
    code: 'SELFIE_MISMATCH',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'A user photo (profile image) does not match a photo on the provided documents'
  },
  ID_INVALID: {
    code: 'ID_INVALID',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'A document that identifies a person (like a passport or an ID card) is not valid'
  },
  FOREIGNER: {
    code: 'FOREIGNER',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'When a client does not accept applicants from a different country or e.g. without a residence permit'
  },
  DUPLICATE: {
    code: 'DUPLICATE',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'This applicant was already created for this client, and duplicates are not allowed by the regulations'
  },
  BAD_AVATAR: {
    code: 'BAD_AVATAR',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'When avatar does not meet the client\'s requirements'
  },
  WRONG_USER_REGION: {
    code: 'WRONG_USER_REGION',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'When applicants from certain regions/countries are not allowed to be registered'
  },
  INCOMPLETE_DOCUMENT: {
    code: 'INCOMPLETE_DOCUMENT',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Some information is missing from the document, or it\'s partially visible'
  },
  BLACKLIST: {
    code: 'BLACKLIST',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'User is blocklisted'
  },
  UNSATISFACTORY_PHOTOS: {
    code: 'UNSATISFACTORY_PHOTOS',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'There were problems with the photos, like poor quality or masked information'
  },
  DOCUMENT_PAGE_MISSING: {
    code: 'DOCUMENT_PAGE_MISSING',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Some pages of a document are missing (if applicable)'
  },
  DOCUMENT_DAMAGED: {
    code: 'DOCUMENT_DAMAGED',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Document is damaged'
  },
  REGULATIONS_VIOLATIONS: {
    code: 'REGULATIONS_VIOLATIONS',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Regulations violations'
  },
  INCONSISTENT_PROFILE: {
    code: 'INCONSISTENT_PROFILE',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Data or documents of different persons were uploaded to one applicant'
  },
  PROBLEMATIC_APPLICANT_DATA: {
    code: 'PROBLEMATIC_APPLICANT_DATA',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Applicant data does not match the data in the documents'
  },
  ADDITIONAL_DOCUMENT_REQUIRED: {
    code: 'ADDITIONAL_DOCUMENT_REQUIRED',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Additional documents required to pass the check'
  },
  AGE_REQUIREMENT_MISMATCH: {
    code: 'AGE_REQUIREMENT_MISMATCH',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Age requirement is not met (e.g. cannot rent a car to a person below 25yo)'
  },
  EXPERIENCE_REQUIREMENT_MISMATCH: {
    code: 'EXPERIENCE_REQUIREMENT_MISMATCH',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Not enough experience (e.g. driving experience is not enough)'
  },
  CRIMINAL: {
    code: 'CRIMINAL',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'The user is involved in illegal actions'
  },
  WRONG_ADDRESS: {
    code: 'WRONG_ADDRESS',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The address from the documents doesn\'t match the address that the user entered'
  },
  GRAPHIC_EDITOR: {
    code: 'GRAPHIC_EDITOR',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The document has been edited by a graphical editor'
  },
  DOCUMENT_DEPRIVED: {
    code: 'DOCUMENT_DEPRIVED',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user has been deprived of the document'
  },
  COMPROMISED_PERSONS: {
    code: 'COMPROMISED_PERSONS',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'The user does not correspond to Compromised Person Politics'
  },
  PEP: {
    code: 'PEP',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'The user belongs to the PEP category'
  },
  ADVERSE_MEDIA: {
    code: 'ADVERSE_MEDIA',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'The user was found in the adverse media'
  },
  FRAUDULENT_PATTERNS: {
    code: 'FRAUDULENT_PATTERNS',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'Fraudulent behavior was detected'
  },
  SANCTIONS: {
    code: 'SANCTIONS',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'The user was found on sanction lists'
  },
  NOT_ALL_CHECKS_COMPLETED: {
    code: 'NOT_ALL_CHECKS_COMPLETED',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'All checks were not completed'
  },
  FRONT_SIDE_MISSING: {
    code: 'FRONT_SIDE_MISSING',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Front side of the document is missing'
  },
  BACK_SIDE_MISSING: {
    code: 'BACK_SIDE_MISSING',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Back side of the document is missing'
  },
  SCREENSHOTS: {
    code: 'SCREENSHOTS',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded screenshots'
  },
  BLACK_AND_WHITE: {
    code: 'BLACK_AND_WHITE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded black and white photos of documents'
  },
  INCOMPATIBLE_LANGUAGE: {
    code: 'INCOMPATIBLE_LANGUAGE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user should upload translation of his document'
  },
  EXPIRATION_DATE: {
    code: 'EXPIRATION_DATE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded expired document'
  },
  UNFILLED_ID: {
    code: 'UNFILLED_ID',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded the document without signatures and stamps'
  },
  BAD_SELFIE: {
    code: 'BAD_SELFIE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded a bad selfie'
  },
  BAD_VIDEO_SELFIE: {
    code: 'BAD_VIDEO_SELFIE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded a bad video selfie'
  },
  BAD_FACE_MATCHING: {
    code: 'BAD_FACE_MATCHING',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Face check between document and selfie failed'
  },
  BAD_PROOF_OF_IDENTITY: {
    code: 'BAD_PROOF_OF_IDENTITY',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded a bad ID document'
  },
  BAD_PROOF_OF_ADDRESS: {
    code: 'BAD_PROOF_OF_ADDRESS',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded a bad proof of address'
  },
  BAD_PROOF_OF_PAYMENT: {
    code: 'BAD_PROOF_OF_PAYMENT',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user uploaded a bad proof of payment'
  },
  SELFIE_WITH_PAPER: {
    code: 'SELFIE_WITH_PAPER',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'The user should upload a special selfie (e.g. selfie with paper and date on it)'
  },
  FRAUDULENT_LIVENESS: {
    code: 'FRAUDULENT_LIVENESS',
    rejectType: REVIEW_REJECT_TYPES.FINAL,
    description: 'There was an attempt to bypass liveness check'
  },
  OTHER: {
    code: 'OTHER',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Some unclassified reason'
  },
  REQUESTED_DATA_MISMATCH: {
    code: 'REQUESTED_DATA_MISMATCH',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Provided info doesn\'t match with recognized from document data'
  },
  OK: {
    code: 'OK',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Custom reject label'
  },
  COMPANY_NOT_DEFINED_STRUCTURE: {
    code: 'COMPANY_NOT_DEFINED_STRUCTURE',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Could not establish the entity\'s control structure'
  },
  COMPANY_NOT_DEFINED_BENEFICIARIES: {
    code: 'COMPANY_NOT_DEFINED_BENEFICIARIES',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Could not identify and duly verify the entity\'s beneficial owners'
  },
  COMPANY_NOT_VALIDATED_BENEFICIARIES: {
    code: 'COMPANY_NOT_VALIDATED_BENEFICIARIES',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Beneficiaries are not validated'
  },
  COMPANY_NOT_DEFINED_REPRESENTATIVES: {
    code: 'COMPANY_NOT_DEFINED_REPRESENTATIVES',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Representatives are not defined'
  },
  COMPANY_NOT_VALIDATED_REPRESENTATIVES: {
    code: 'COMPANY_NOT_VALIDATED_REPRESENTATIVES',
    rejectType: REVIEW_REJECT_TYPES.RETRY,
    description: 'Representatives are not validated'
  },
}

const REVIEW_STATUS = {
  init: 'Initial registration has started. A client is still in the process of filling out the applicant profile. Not all required documents are currently uploaded',
  pending: 'An applicant is ready to be processed',
  prechecked: 'The check is in a half way of being finished',
  queued: 'The checks have been started for the applicant',
  completed: 'The check has been completed',
  onHold: 'Applicant waits for a final decision from compliance officer (manual check was initiated) or waits for all beneficiaries to pass KYC in case of company verification',
}

const RESETTABLE_VERIFICATION_STEPS = {
  PHONE_VERIFICATION: {
    code: 'PHONE_VERIFICATION',
    description: 'Phone verification step'
  },
  EMAIL_VERIFICATION: {
    code: 'EMAIL_VERIFICATION',
    description: 'Email verification step'
  },
  QUESTIONNAIRE: {
    code: 'QUESTIONNAIRE',
    description: 'Questionnaire'
  },
  APPLICANT_DATA: {
    code: 'APPLICANT_DATA',
    description: 'Applicant data'
  },
  IDENTITY: {
    code: 'IDENTITY',
    description: 'Identity step'
  },
  PROOF_OF_RESIDENCE: {
    code: 'PROOF_OF_RESIDENCE',
    description: 'Proof of residence'
  },
  SELFIE: {
    code: 'SELFIE',
    description: 'Selfie step'
  },
}

module.exports = {
  ADD_ID_DOCUMENT_WARNINGS,
  ADD_ID_DOCUMENT_ERRORS,
  SUPPORTED_DOCUMENT_TYPES,
  VERIFICATION_RESULTS,
  REVIEW_REJECT_LABELS,
  REVIEW_STATUS,
  RESETTABLE_VERIFICATION_STEPS
}
