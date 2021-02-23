const authentication = require('../modules/authentication')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessionList(),
    userSessions: (...[, { username }]) => sessionManager.getUserSessions(username),
    userData: (root, args, context, info) => authentication.getUserData(context),
    get2FASecret: (...[, { username, password }]) => authentication.get2FASecret(username, password),
    confirm2FA: (root, args, context, info) => authentication.confirm2FA(args.code, context),
    validateRegisterLink: (...[, { token }]) => authentication.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => authentication.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => authentication.validateReset2FALink(token),
    generateAttestationOptions: (root, args, context, info) => authentication.generateAttestationOptions(args.userID, context.req.session),
    generateAssertionOptions: (root, args, context, info) => authentication.generateAssertionOptions(context)
  },
  Mutation: {
    deleteUser: (...[, { id }]) => users.deleteUser(id),
    deleteSession: (root, args, context, info) => authentication.deleteSession(args.sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteUserSessions(username),
    changeUserRole: (...[, { id, newRole }]) => users.changeUserRole(id, newRole),
    toggleUserEnable: (...[, { id }]) => users.toggleUserEnable(id),
    login: (...[, { username, password }]) => authentication.login(username, password),
    input2FA: (root, args, context, info) => authentication.input2FA(args.username, args.password, args.rememberMe, args.code, context),
    setup2FA: (...[, { username, password, secret, codeConfirmation }]) => authentication.setup2FA(username, password, secret, codeConfirmation),
    createResetPasswordToken: (...[, { userID }]) => authentication.createResetPasswordToken(userID),
    createReset2FAToken: (...[, { userID }]) => authentication.createReset2FAToken(userID),
    createRegisterToken: (...[, { username, role }]) => authentication.createRegisterToken(username, role),
    register: (...[, { username, password, role }]) => authentication.register(username, password, role),
    resetPassword: (root, args, context, info) => authentication.resetPassword(args.userID, args.newPassword, context),
    reset2FA: (root, args, context, info) => authentication.reset2FA(args.userID, args.code, args.secret, context),
    validateAttestation: (root, args, context, info) => authentication.validateAttestation(args.userID, args.attestationResponse, context),
    validateAssertion: (root, args, context, info) => authentication.validateAssertion(args.assertionResponse, context)
  }
}

module.exports = resolver
