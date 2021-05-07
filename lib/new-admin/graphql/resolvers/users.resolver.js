const authentication = require('../modules/authentication')
const userManagement = require('../modules/userManagement')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const getFIDOStrategyQueries = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return {
        generateAttestationOptions: (...[, { userID }, context]) => authentication.strategy.generateAttestationOptions(userID, context.req.session),
        generateAssertionOptions: (...[, { username, password }, context]) => authentication.strategy.generateAssertionOptions(username, password, context)
      }
    case 'FIDOPasswordless':
      return {
        generateAttestationOptions: (...[, { userID }, context]) => authentication.strategy.generateAttestationOptions(userID, context.req.session),
        generateAssertionOptions: (...[, { username }, context]) => authentication.strategy.generateAssertionOptions(username, context)
      }
    case 'FIDOUsernameless':
      return {
        generateAttestationOptions: (...[, { userID }, context]) => authentication.strategy.generateAttestationOptions(userID, context.req.session),
        generateAssertionOptions: (...[, { }, context]) => authentication.strategy.generateAssertionOptions(context)
      }
    default:
      return {}
  }
}

const getFIDOStrategyMutations = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return {
        validateAttestation: (...[, { userID, attestationResponse }, context]) => authentication.strategy.validateAttestation(userID, attestationResponse, context),
        validateAssertion: (...[, { username, password, rememberMe, assertionResponse }, context]) => authentication.strategy.validateAssertion(username, password, rememberMe, assertionResponse, context)
      }
    case 'FIDOPasswordless':
      return {
        validateAttestation: (...[, { userID, attestationResponse }, context]) => authentication.strategy.validateAttestation(userID, attestationResponse, context),
        validateAssertion: (...[, { username, rememberMe, assertionResponse }, context]) => authentication.strategy.validateAssertion(username, rememberMe, assertionResponse, context)
      }
    case 'FIDOUsernameless':
      return {
        validateAttestation: (...[, { userID, attestationResponse }, context]) => authentication.strategy.validateAttestation(userID, attestationResponse, context),
        validateAssertion: (...[, { assertionResponse }, context]) => authentication.strategy.validateAssertion(assertionResponse, context)
      }
    default:
      return {}
  }
}

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessions(),
    userSessions: (...[, { username }]) => sessionManager.getSessionsByUsername(username),
    userData: (...[, {}, context]) => userManagement.getUserData(context),
    get2FASecret: (...[, { username, password }]) => userManagement.get2FASecret(username, password),
    confirm2FA: (...[, { code }, context]) => userManagement.confirm2FA(code, context),
    validateRegisterLink: (...[, { token }]) => userManagement.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => userManagement.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => userManagement.validateReset2FALink(token),
    ...getFIDOStrategyQueries()
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
    createRegisterToken: (...[, { username, role }]) => userManagement.createRegisterToken(username, role),
    register: (...[, { token, username, password, role }]) => userManagement.register(token, username, password, role),
    resetPassword: (...[, { token, userID, newPassword }, context]) => userManagement.resetPassword(token, userID, newPassword, context),
    reset2FA: (...[, { token, userID, code }, context]) => userManagement.reset2FA(token, userID, code, context),
    ...getFIDOStrategyMutations()
  }
}

module.exports = resolver
