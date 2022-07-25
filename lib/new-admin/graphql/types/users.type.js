const authentication = require('../modules/authentication')

const getFIDOStrategyQueryTypes = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return `generateAttestationOptions(userID: ID!, domain: String!): JSONObject
    generateAssertionOptions(username: String!, password: String!, domain: String!): JSONObject`
    case 'FIDOPasswordless':
      return `generateAttestationOptions(userID: ID!, domain: String!): JSONObject
    generateAssertionOptions(username: String!, domain: String!): JSONObject`
    case 'FIDOUsernameless':
      return `generateAttestationOptions(userID: ID!, domain: String!): JSONObject
    generateAssertionOptions(domain: String!): JSONObject`
    default:
      return ``
  }
}

const getFIDOStrategyMutationsTypes = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!, domain: String!): Boolean
    validateAssertion(username: String!, password: String!, rememberMe: Boolean!, assertionResponse: JSONObject!, domain: String!): Boolean`
    case 'FIDOPasswordless':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!, domain: String!): Boolean
    validateAssertion(username: String!, rememberMe: Boolean!, assertionResponse: JSONObject!, domain: String!): Boolean`
    case 'FIDOUsernameless':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!, domain: String!): Boolean
    validateAssertion(assertionResponse: JSONObject!, domain: String!): Boolean`
    default:
      return ``
  }
}

const typeDef = `
  directive @auth(permissions: [String]) on OBJECT | FIELD_DEFINITION

  type UserSession {
    sid: String!
    sess: JSONObject!
    expire: Date!
  }

  type User {
    id: ID
    username: String
    role: String
    enabled: Boolean
    created: Date
    last_accessed: Date
    last_accessed_from: String
    last_accessed_address: String
  }

  type TwoFactorSecret {
    user_id: ID
    secret: String!
    otpauth: String!
  }

  type ResetToken {
    token: String
    user_id: ID
    expire: Date
  }

  type RegistrationToken {
    token: String
    username: String
    role: String
    expire: Date
  }

  type Query {
    users: [User] @auth(permissions: ["users:read"])
    sessions: [UserSession] @auth(permissions: ["users:read"])
    userSessions(username: String!): [UserSession] @auth(permissions: ["users:read"])
    userData: User
    get2FASecret(username: String!, password: String!): TwoFactorSecret
    confirm2FA(code: String!): Boolean @auth(permissions: ["users:edit"])
    validateRegisterLink(token: String!): User
    validateResetPasswordLink(token: String!): User
    validateReset2FALink(token: String!): TwoFactorSecret
    ${getFIDOStrategyQueryTypes()}
  }

  type Mutation {
    enableUser(confirmationCode: String, id: ID!): User @auth(permissions: ["users:edit"])
    disableUser(confirmationCode: String, id: ID!): User @auth(permissions: ["users:edit"])
    deleteSession(sid: String!): UserSession @auth(permissions: ["users:edit"])
    deleteUserSessions(username: String!): [UserSession] @auth(permissions: ["users:edit"])
    changeUserRole(confirmationCode: String, id: ID!, newRole: String!): User @auth(permissions: ["users:edit"])
    toggleUserEnable(id: ID!): User @auth(permissions: ["users:edit"])
    login(username: String!, password: String!): String
    input2FA(username: String!, password: String!, code: String!, rememberMe: Boolean!): Boolean
    setup2FA(username: String!, password: String!, rememberMe: Boolean!, codeConfirmation: String!): Boolean
    createResetPasswordToken(confirmationCode: String, userID: ID!): ResetToken @auth(permissions: ["users:edit"])
    createReset2FAToken(confirmationCode: String, userID: ID!): ResetToken @auth(permissions: ["users:edit"])
    createRegisterToken(username: String!, role: String!): RegistrationToken @auth(permissions: ["users:edit"])
    register(token: String!, username: String!, password: String!, role: String!): Boolean
    resetPassword(token: String!, userID: ID!, newPassword: String!): Boolean
    reset2FA(token: String!, userID: ID!, code: String!): Boolean
    ${getFIDOStrategyMutationsTypes()}
  }
`

module.exports = typeDef
