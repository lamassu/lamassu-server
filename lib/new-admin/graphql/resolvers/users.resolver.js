const authentication = require('../modules/authentication')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessions(),
    userSessions: (...[, { username }]) => sessionManager.getSessionsByUsername(username),
    userData: (...[, {}, context]) => authentication.getUserData(context),
    get2FASecret: (...[, { username, password }]) => authentication.get2FASecret(username, password),
    confirm2FA: (...[, { code }, context]) => authentication.confirm2FA(code, context),
    validateRegisterLink: (...[, { token }]) => authentication.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => authentication.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => authentication.validateReset2FALink(token)
  },
  Mutation: {
    enableUser: (...[, { confirmationCode, id }, context]) => authentication.enableUser(confirmationCode, id, context),
    disableUser: (...[, { confirmationCode, id }, context]) => authentication.disableUser(confirmationCode, id, context),
    deleteSession: (...[, { sid }, context]) => authentication.deleteSession(sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteSessionsByUsername(username),
    changeUserRole: (...[, { confirmationCode, id, newRole }, context]) => authentication.changeUserRole(confirmationCode, id, newRole, context),
    login: (...[, { username, password }]) => authentication.login(username, password),
    input2FA: (...[, { username, password, rememberMe, code }, context]) => authentication.input2FA(username, password, rememberMe, code, context),
    setup2FA: (...[, { username, password, rememberMe, codeConfirmation }, context]) => authentication.setup2FA(username, password, rememberMe, codeConfirmation, context),
    createResetPasswordToken: (...[, { confirmationCode, userID }, context]) => authentication.createResetPasswordToken(confirmationCode, userID, context),
    createReset2FAToken: (...[, { confirmationCode, userID }, context]) => authentication.createReset2FAToken(confirmationCode, userID, context),
    createRegisterToken: (...[, { username, role }]) => authentication.createRegisterToken(username, role),
    register: (...[, { token, username, password, role }]) => authentication.register(token, username, password, role),
    resetPassword: (...[, { token, userID, newPassword }, context]) => authentication.resetPassword(token, userID, newPassword, context),
    reset2FA: (...[, { token, userID, code, secret }, context]) => authentication.reset2FA(token, userID, code, secret, context)
  }
}

module.exports = resolver
