const authentication = require('../modules/authentication')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const resolver = {
  Query: {
    users: () => users.getUsers(),
    sessions: () => sessionManager.getSessions(),
    userSessions: (...[, { username }]) => sessionManager.getSessionsByUsername(username),
    userData: (root, args, context, info) => authentication.getUserData(context),
    get2FASecret: (...[, { username, password }]) => authentication.get2FASecret(username, password),
    confirm2FA: (root, args, context, info) => authentication.confirm2FA(args.code, context),
    validateRegisterLink: (...[, { token }]) => authentication.validateRegisterLink(token),
    validateResetPasswordLink: (...[, { token }]) => authentication.validateResetPasswordLink(token),
    validateReset2FALink: (...[, { token }]) => authentication.validateReset2FALink(token)
  },
  Mutation: {
    enableUser: (...[, { id }]) => users.enableUser(id),
    disableUser: (...[, { id }]) => users.disableUser(id),
    deleteSession: (root, args, context, info) => authentication.deleteSession(args.sid, context),
    deleteUserSessions: (...[, { username }]) => sessionManager.deleteSessionsByUsername(username),
    changeUserRole: (...[, { id, newRole }]) => users.changeUserRole(id, newRole),
    login: (...[, { username, password }]) => authentication.login(username, password),
    input2FA: (root, args, context, info) => authentication.input2FA(args.username, args.password, args.rememberMe, args.code, context),
    setup2FA: (...[, { username, password, secret, codeConfirmation }]) => authentication.setup2FA(username, password, secret, codeConfirmation),
    createResetPasswordToken: (...[, { userID }]) => authentication.createResetPasswordToken(userID),
    createReset2FAToken: (...[, { userID }]) => authentication.createReset2FAToken(userID),
    createRegisterToken: (...[, { username, role }]) => authentication.createRegisterToken(username, role),
    register: (...[, { token, username, password, role }]) => authentication.register(token, username, password, role),
    resetPassword: (root, args, context, info) => authentication.resetPassword(args.token, args.userID, args.newPassword, context),
    reset2FA: (root, args, context, info) => authentication.reset2FA(args.token, args.userID, args.code, args.secret, context)
  }
}

module.exports = resolver
