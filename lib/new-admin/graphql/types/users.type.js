const authentication = require('../modules/authentication')

const getFIDOStrategyQueryTypes = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return `generateAttestationOptions(userID: ID!): JSONObject
    generateAssertionOptions(username: String!, password: String!): JSONObject`
    case 'FIDOPasswordless':
      return `generateAttestationOptions(userID: ID!): JSONObject
    generateAssertionOptions(username: String!): JSONObject`
    case 'FIDOUsernameless':
      return `generateAttestationOptions(userID: ID!): JSONObject
    generateAssertionOptions: JSONObject`
    default:
      return ``
  }
}

const getFIDOStrategyMutationsTypes = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!): Boolean
    validateAssertion(username: String!, password: String!, rememberMe: Boolean!, assertionResponse: JSONObject!): Boolean`
    case 'FIDOPasswordless':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!): Boolean
    validateAssertion(username: String!, rememberMe: Boolean!, assertionResponse: JSONObject!): Boolean`
    case 'FIDOUsernameless':
      return `validateAttestation(userID: ID!, attestationResponse: JSONObject!): Boolean
    validateAssertion(assertionResponse: JSONObject!): Boolean`
    default:
      return ``
  }
}

const typeDef = `
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
    users: [User] @auth(requires: [SUPERUSER])
    sessions: [UserSession] @auth(requires: [SUPERUSER])
    userSessions(username: String!): [UserSession] @auth(requires: [SUPERUSER])
    userData: User
    validateRegisterLink(token: String!): User
    validateResetPasswordLink(token: String!): User
    validateReset2FALink(token: String!): TwoFactorSecret
    get2FASecret(username: String!, password: String!): TwoFactorSecret
    confirm2FA(code: String!): Boolean @auth(requires: [SUPERUSER])
    ${getFIDOStrategyQueryTypes()}
  }

  type Mutation {
    deleteUser(id: ID!): User @auth(requires: [SUPERUSER])
    deleteSession(sid: String!): UserSession @auth(requires: [SUPERUSER])
    deleteUserSessions(username: String!): [UserSession] @auth(requires: [SUPERUSER])
    changeUserRole(id: ID!, newRole: String!): User @auth(requires: [SUPERUSER])
    toggleUserEnable(id: ID!): User @auth(requires: [SUPERUSER])
    login(username: String!, password: String!): String
    input2FA(username: String!, password: String!, code: String!, rememberMe: Boolean!): Boolean
    setup2FA(username: String!, password: String!, secret: String!, codeConfirmation: String!): Boolean
    createResetPasswordToken(userID: ID!): ResetToken @auth(requires: [SUPERUSER])
    createReset2FAToken(userID: ID!): ResetToken @auth(requires: [SUPERUSER])
    createRegisterToken(username: String!, role: String!): RegistrationToken @auth(requires: [SUPERUSER])
    register(username: String!, password: String!, role: String!): Boolean
    resetPassword(userID: ID!, newPassword: String!): Boolean
    reset2FA(userID: ID!, secret: String!, code: String!): Boolean
    get2FASecret(username: String!, password: String!): TwoFactorSecret
    confirm2FA(code: String!): Boolean @auth(requires: [SUPERUSER])
    ${getFIDOStrategyMutationsTypes()}
  }
`

module.exports = typeDef
