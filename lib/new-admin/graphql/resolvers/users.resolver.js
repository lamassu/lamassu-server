const authentication = require('../modules/authentication')
const userManagement = require('../modules/userManagement')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const getFIDOStrategyQueries = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return {
        generateAttestationOptions: (root, args, context, info) => authentication.strategy.generateAttestationOptions(args.userID, context.req.session),
        generateAssertionOptions: (root, args, context, info) => authentication.strategy.generateAssertionOptions(args.username, args.password, context)
      }
    case 'FIDOPasswordless':
      return {
        generateAttestationOptions: (root, args, context, info) => authentication.strategy.generateAttestationOptions(args.userID, context.req.session),
        generateAssertionOptions: (root, args, context, info) => authentication.strategy.generateAssertionOptions(args.username, context)
      }
    case 'FIDOUsernameless':
      return {
        generateAttestationOptions: (root, args, context, info) => authentication.strategy.generateAttestationOptions(args.userID, context.req.session),
        generateAssertionOptions: (root, args, context, info) => authentication.strategy.generateAssertionOptions(context)
      }
    default:
      return {}
  }
}

const getFIDOStrategyMutations = () => {
  switch (authentication.CHOSEN_STRATEGY) {
    case 'FIDO2FA':
      return {
        validateAttestation: (root, args, context, info) => authentication.strategy.validateAttestation(args.userID, args.attestationResponse, context),
        validateAssertion: (root, args, context, info) => authentication.strategy.validateAssertion(args.username, args.password, args.rememberMe, args.assertionResponse, context)
      }
    case 'FIDOPasswordless':
      return {
        validateAttestation: (root, args, context, info) => authentication.strategy.validateAttestation(args.userID, args.attestationResponse, context),
        validateAssertion: (root, args, context, info) => authentication.strategy.validateAssertion(args.username, args.rememberMe, args.assertionResponse, context)
      }
    case 'FIDOUsernameless':
      return {
        validateAttestation: (root, args, context, info) => authentication.strategy.validateAttestation(args.userID, args.attestationResponse, context),
        validateAssertion: (root, args, context, info) => authentication.strategy.validateAssertion(args.assertionResponse, context)
      }
    default:
      return {}
  }
}

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessionList(),
    userSessions: (...[, { username }]) => sessionManager.getUserSessions(username),
    userData: (root, args, context, info) => userManagement.getUserData(context),
    validateRegisterLink: (...[, { token }]) => userManagement.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => userManagement.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => userManagement.validateReset2FALink(token),
    get2FASecret: (...[, { username, password }]) => userManagement.get2FASecret(username, password),
    confirm2FA: (root, args, context, info) => userManagement.confirm2FA(args.code, context),
    ...getFIDOStrategyQueries()
  },
  Mutation: {
    deleteUser: (...[, { id }]) => users.deleteUser(id),
    deleteSession: (root, args, context, info) => userManagement.deleteSession(args.sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteUserSessions(username),
    changeUserRole: (...[, { id, newRole }]) => users.changeUserRole(id, newRole),
    toggleUserEnable: (...[, { id }]) => users.toggleUserEnable(id),
    createResetPasswordToken: (...[, { userID }]) => userManagement.createResetPasswordToken(userID),
    createReset2FAToken: (...[, { userID }]) => userManagement.createReset2FAToken(userID),
    createRegisterToken: (...[, { username, role }]) => userManagement.createRegisterToken(username, role),
    register: (...[, { username, password, role }]) => userManagement.register(username, password, role),
    resetPassword: (root, args, context, info) => userManagement.resetPassword(args.userID, args.newPassword, context),
    reset2FA: (root, args, context, info) => userManagement.reset2FA(args.userID, args.code, args.secret, context),
    login: (...[, { username, password }]) => userManagement.login(username, password),
    input2FA: (root, args, context, info) => userManagement.input2FA(args.username, args.password, args.rememberMe, args.code, context),
    setup2FA: (...[, { username, password, secret, codeConfirmation }]) => userManagement.setup2FA(username, password, secret, codeConfirmation),
    ...getFIDOStrategyMutations()
  }
}

module.exports = resolver
