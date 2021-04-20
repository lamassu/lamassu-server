const typeDef = `
  directive @auth(
    requires: [Role] = [USER, SUPERUSER]
  ) on OBJECT | FIELD_DEFINITION

  enum Role {
    SUPERUSER
    USER
  }

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
    get2FASecret(username: String!, password: String!): TwoFactorSecret
    confirm2FA(code: String!): Boolean @auth(requires: [SUPERUSER])
    validateRegisterLink(token: String!): User
    validateResetPasswordLink(token: String!): User
    validateReset2FALink(token: String!): TwoFactorSecret
  }

  type Mutation {
    enableUser(confirmationCode: String, id: ID!): User @auth(requires: [SUPERUSER])
    disableUser(confirmationCode: String, id: ID!): User @auth(requires: [SUPERUSER])
    deleteSession(sid: String!): UserSession @auth(requires: [SUPERUSER])
    deleteUserSessions(username: String!): [UserSession] @auth(requires: [SUPERUSER])
    changeUserRole(confirmationCode: String, id: ID!, newRole: String!): User @auth(requires: [SUPERUSER])
    toggleUserEnable(id: ID!): User @auth(requires: [SUPERUSER])
    login(username: String!, password: String!): String
    input2FA(username: String!, password: String!, code: String!, rememberMe: Boolean!): Boolean
    setup2FA(username: String!, password: String!, rememberMe: Boolean!, codeConfirmation: String!): Boolean
    createResetPasswordToken(confirmationCode: String, userID: ID!): ResetToken @auth(requires: [SUPERUSER])
    createReset2FAToken(confirmationCode: String, userID: ID!): ResetToken @auth(requires: [SUPERUSER])
    createRegisterToken(username: String!, role: String!): RegistrationToken @auth(requires: [SUPERUSER])
    register(token: String!, username: String!, password: String!, role: String!): Boolean
    resetPassword(token: String!, userID: ID!, newPassword: String!): Boolean
    reset2FA(token: String!, userID: ID!, code: String!): Boolean
  }
`

module.exports = typeDef
