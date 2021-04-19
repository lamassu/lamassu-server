const otplib = require('otplib')
const bcrypt = require('bcrypt')

const loginHelper = require('../../services/login')
const T = require('../../../time')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')
const authErrors = require('../errors/authentication')

const REMEMBER_ME_AGE = 90 * T.day

const authenticateUser = (username, password) => {
  return users.getUserByUsername(username)
    .then(user => {
      const hashedPassword = user.password
      if (!hashedPassword || !user.enabled) throw new authErrors.InvalidCredentialsError()
      return Promise.all([bcrypt.compare(password, hashedPassword), hashedPassword])
    })
    .then(([isMatch, hashedPassword]) => {
      if (!isMatch) throw new authErrors.InvalidCredentialsError()
      return loginHelper.validateUser(username, hashedPassword)
    })
    .then(user => {
      if (!user) throw new authErrors.InvalidCredentialsError()
      return user
    })
}

const destroySessionIfSameUser = (context, user) => {
  const sessionUser = getUserFromCookie(context)
  if (sessionUser && user.id === sessionUser.id)
    context.req.session.destroy()
}

const destroySessionIfBeingUsed = (sessID, context) => {
  if (sessID === context.req.session.id) {
    context.req.session.destroy()
  }
}

const getUserFromCookie = context => {
  return context.req.session.user
}

const getLamassuCookie = context => {
  return context.req.cookies && context.req.cookies.lid
}

const initializeSession = (context, user, rememberMe) => {
  const finalUser = { id: user.id, username: user.username, role: user.role }
  context.req.session.user = finalUser
  if (rememberMe) context.req.session.cookie.maxAge = REMEMBER_ME_AGE
}

const getUserData = context => {
  const lidCookie = getLamassuCookie(context)
  if (!lidCookie) return

  const user = getUserFromCookie(context)
  return user
}

const get2FASecret = (username, password) => {
  return authenticateUser(username, password)
    .then(user => {
      const secret = otplib.authenticator.generateSecret()
      const otpauth = otplib.authenticator.keyuri(user.username, 'Lamassu Industries', secret)
      return Promise.all([users.saveTemp2FASecret(user.id, secret), secret, otpauth])
    })
    .then(([_, secret, otpauth]) => {
      return { secret, otpauth }
    })
}

const confirm2FA = (token, context) => {
  const requestingUser = getUserFromCookie(context)

  if (!requestingUser) throw new authErrors.InvalidCredentialsError()

  return users.getUserById(requestingUser.id).then(user => {
    const secret = user.twofa_code
    const isCodeValid = otplib.authenticator.verify({ token, secret })

    if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()
    return true
  })
}

const validateRegisterLink = token => {
  if (!token) throw new authErrors.InvalidUrlError()
  return users.validateUserRegistrationToken(token)
    .then(r => {
      if (!r.success) throw new authErrors.InvalidUrlError()
      return { username: r.username, role: r.role }
    })
    .catch(err => console.error(err))
}

const validateResetPasswordLink = token => {
  if (!token) throw new authErrors.InvalidUrlError()
  return users.validateAuthToken(token, 'reset_password')
    .then(r => {
      if (!r.success) throw new authErrors.InvalidUrlError()
      return { id: r.userID }
    })
    .catch(err => console.error(err))
}

const validateReset2FALink = token => {
  if (!token) throw new authErrors.InvalidUrlError()
  return users.validateAuthToken(token, 'reset_twofa')
    .then(r => {
      if (!r.success) throw new authErrors.InvalidUrlError()
      return users.getUserById(r.userID)
    })
    .then(user => {
      const secret = otplib.authenticator.generateSecret()
      const otpauth = otplib.authenticator.keyuri(user.username, 'Lamassu Industries', secret)
      return Promise.all([users.saveTemp2FASecret(user.id, secret), user, secret, otpauth])
    })
    .then(([_, user, secret, otpauth]) => {
      return { user_id: user.id, secret, otpauth }
    })
    .catch(err => console.error(err))
}

const deleteSession = (sessionID, context) => {
  destroySessionIfBeingUsed(sessionID, context)
  return sessionManager.deleteSessionById(sessionID)
}

const login = (username, password) => {
  return authenticateUser(username, password).then(user => {
    const twoFASecret = user.twofa_code
    return twoFASecret ? 'INPUT2FA' : 'SETUP2FA'
  })
}

const input2FA = (username, password, rememberMe, code, context) => {
  return authenticateUser(username, password)
    .then(user => {
      const secret = user.twofa_code
      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()

      initializeSession(context, user, rememberMe)
      return true
    })
}

const setup2FA = (username, password, rememberMe, secret, codeConfirmation, context) => {
  if (!secret) throw new authErrors.InvalidTwoFactorError()

  const isCodeValid = otplib.authenticator.verify({ token: codeConfirmation, secret: secret })
  if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()

  return authenticateUser(username, password)
    .then(user => {
      if (user.temp_twofa_code !== secret) {
        throw new authErrors.InvalidTwoFactorError()
      }

      initializeSession(context, user, rememberMe)
      return users.save2FASecret(user.id, secret)
    })
    .then(() => true)
}

const changeUserRole = (code, id, newRole, context) => {
  const action = (id, newRole) => users.changeUserRole(id, newRole)

  return users.getUserById(id)
    .then(user => {
      if (user.role !== 'superuser') {
        return action(id, newRole)
      }
    
      return confirm2FA(code, context)
    })
    .then(() => action(id, newRole))
}

const enableUser = (code, id, context) => {
  const action = id => users.enableUser(id)

  return users.getUserById(id)
    .then(user => {
      if (user.role !== 'superuser') {
        return action(id)
      }
    
      return confirm2FA(code, context)
    })
    .then(() => action(id))
}

const disableUser = (code, id, context) => {
  const action = id => users.disableUser(id)

  return users.getUserById(id)
    .then(user => {
      if (user.role !== 'superuser') {
        return action(id)
      }
    
      return confirm2FA(code, context)
    })
    .then(() => action(id))
}

const createResetPasswordToken = (code, userID, context) => {
  const action = user => users.createAuthToken(user.id, 'reset_password')

  return users.getUserById(userID)
    .then(user => {
      if (user.role !== 'superuser') {
        return action(user.id)
      }
    
      return confirm2FA(code, context)
        .then(() => action(user))
    })
}

const createReset2FAToken = (code, userID, context) => {
  const action = user => users.createAuthToken(user.id, 'reset_twofa')

  return users.getUserById(userID)
    .then(user => {
      if (user.role !== 'superuser') {
        return action(user)
      }
    
      return confirm2FA(code, context)
        .then(() => action(user))
    })
}

const createRegisterToken = (username, role) => {
  return users.getUserByUsername(username)
    .then(user => {
      if (user) throw new authErrors.UserAlreadyExistsError()

      return users.createUserRegistrationToken(username, role)
    })
    .catch(err => console.error(err))
}

const register = (token, username, password, role) => {
  return users.getUserByUsername(username)
    .then(user => {
      if (user) throw new authErrors.UserAlreadyExistsError()
      return users.register(token, username, password, role).then(() => true)
    })
    .catch(err => console.error(err))
}

const resetPassword = (token, userID, newPassword, context) => {
  return users.getUserById(userID)
    .then(user => {
      destroySessionIfSameUser(context, user)
      return users.updatePassword(token, user.id, newPassword)
    })
    .then(() => true)
    .catch(err => console.error(err))
}

const reset2FA = (token, userID, code, secret, context) => {
  const isCodeValid = otplib.authenticator.verify({ token: code, secret })
  if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()

  return users.getUserById(userID)
    .then(user => {
      destroySessionIfSameUser(context, user)
      return users.reset2FASecret(token, user.id, secret).then(() => true)
    })
    .catch(err => console.error(err))
}

module.exports = {
  getUserData,
  get2FASecret,
  confirm2FA,
  validateRegisterLink,
  validateResetPasswordLink,
  validateReset2FALink,
  deleteSession,
  login,
  input2FA,
  setup2FA,
  changeUserRole,
  enableUser,
  disableUser,
  createResetPasswordToken,
  createReset2FAToken,
  createRegisterToken,
  register,
  resetPassword,
  reset2FA
}
