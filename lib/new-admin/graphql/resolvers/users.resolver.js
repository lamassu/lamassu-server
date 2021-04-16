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
    enableUser: (...[, { id }]) => users.enableUser(id),
    disableUser: (...[, { id }]) => users.disableUser(id),
    deleteSession: (...[, { sid }, context]) => authentication.deleteSession(sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteSessionsByUsername(username),
    changeUserRole: (...[, { id, newRole }]) => users.changeUserRole(id, newRole),
    login: (...[, { username, password }]) => authentication.login(username, password),
    input2FA: (...[, { username, password, rememberMe, code }, context]) => authentication.input2FA(username, password, rememberMe, code, context),
    setup2FA: (...[, { username, password, rememberMe, secret, codeConfirmation }, context]) => authentication.setup2FA(username, password, rememberMe, secret, codeConfirmation, context),
    createResetPasswordToken: (...[, { userID }]) => authentication.createResetPasswordToken(userID),
    createReset2FAToken: (...[, { userID }]) => authentication.createReset2FAToken(userID),
    createRegisterToken: (...[, { username, role }]) => authentication.createRegisterToken(username, role),
    register: (...[, { token, username, password, role }]) => authentication.register(token, username, password, role),
    resetPassword: (...[, { token, userID, newPassword }, context]) => authentication.resetPassword(token, userID, newPassword, context),
    reset2FA: (...[, { token, userID, code, secret }, context]) => authentication.reset2FA(token, userID, code, secret, context)
  }
}

module.exports = resolver
