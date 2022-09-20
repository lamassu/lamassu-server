const authentication = require('../modules/authentication')
const userManagement = require('../modules/userManagement')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const getAttestationQueryOptions = variables => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return { userId: variables.userID, domain: variables.domain }
    case 'FIDOPasswordless':
      return { userId: variables.userID, domain: variables.domain }
    case 'FIDOUsernameless':
      return { userId: variables.userID, domain: variables.domain }
    default:
      return {}
  }
}

const getAssertionQueryOptions = variables => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return { username: variables.username, password: variables.password, domain: variables.domain }
    case 'FIDOPasswordless':
      return { username: variables.username, domain: variables.domain }
    case 'FIDOUsernameless':
      return { domain: variables.domain }
    default:
      return {}
  }
}

const getAttestationMutationOptions = variables => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return { userId: variables.userID, attestationResponse: variables.attestationResponse, domain: variables.domain }
    case 'FIDOPasswordless':
      return { userId: variables.userID, attestationResponse: variables.attestationResponse, domain: variables.domain }
    case 'FIDOUsernameless':
      return { userId: variables.userID, attestationResponse: variables.attestationResponse, domain: variables.domain }
    default:
      return {}
  }
}

const getAssertionMutationOptions = variables => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return { username: variables.username, password: variables.password, rememberMe: variables.rememberMe, assertionResponse: variables.assertionResponse, domain: variables.domain }
    case 'FIDOPasswordless':
      return { username: variables.username, rememberMe: variables.rememberMe, assertionResponse: variables.assertionResponse, domain: variables.domain }
    case 'FIDOUsernameless':
      return { assertionResponse: variables.assertionResponse, domain: variables.domain }
    default:
      return {}
  }
}

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessions(),
    roles: () => users.getRoles(),
    userSessions: (...[, { username }]) => sessionManager.getSessionsByUsername(username),
    userData: (...[, {}, context]) => userManagement.getUserData(context),
    get2FASecret: (...[, { username, password }]) => userManagement.get2FASecret(username, password),
    confirm2FA: (...[, { code }, context]) => userManagement.confirm2FA(code, context),
    validateRegisterLink: (...[, { token }]) => userManagement.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => userManagement.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => userManagement.validateReset2FALink(token),
    generateAttestationOptions: (...[, variables, context]) => authentication.strategy.generateAttestationOptions(context.req.session, getAttestationQueryOptions(variables)),
    generateAssertionOptions: (...[, variables, context]) => authentication.strategy.generateAssertionOptions(context.req.session, getAssertionQueryOptions(variables))
  },
  Mutation: {
    enableUser: (...[, { confirmationCode, id }, context]) => userManagement.enableUser(confirmationCode, id, context),
    disableUser: (...[, { confirmationCode, id }, context]) => userManagement.disableUser(confirmationCode, id, context),
    deleteSession: (...[, { sid }, context]) => userManagement.deleteSession(sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteSessionsByUsername(username),
    changeUserRole: (...[, { confirmationCode, id, newRole }, context]) => userManagement.changeUserRole(confirmationCode, id, newRole, context),
    login: (...[, { username, password }]) => userManagement.login(username, password),
    input2FA: (...[, { username, password, rememberMe, code }, context]) => userManagement.input2FA(username, password, rememberMe, code, context),
    setup2FA: (...[, { username, password, rememberMe, codeConfirmation }, context]) => userManagement.setup2FA(username, password, rememberMe, codeConfirmation, context),
    createResetPasswordToken: (...[, { confirmationCode, userID }, context]) => userManagement.createResetPasswordToken(confirmationCode, userID, context),
    createReset2FAToken: (...[, { confirmationCode, userID }, context]) => userManagement.createReset2FAToken(confirmationCode, userID, context),
    createRegisterToken: (...[, { username, roleId }]) => userManagement.createRegisterToken(username, roleId),
    register: (...[, { token, username, password, roleId }]) => userManagement.register(token, username, password, roleId),
    resetPassword: (...[, { token, userID, newPassword }, context]) => userManagement.resetPassword(token, userID, newPassword, context),
    reset2FA: (...[, { token, userID, code }, context]) => userManagement.reset2FA(token, userID, code, context),
    validateAttestation: (...[, variables, context]) => authentication.strategy.validateAttestation(context.req.session, getAttestationMutationOptions(variables)),
    validateAssertion: (...[, variables, context]) => authentication.strategy.validateAssertion(context.req.session, getAssertionMutationOptions(variables))
  }
}

module.exports = resolver
