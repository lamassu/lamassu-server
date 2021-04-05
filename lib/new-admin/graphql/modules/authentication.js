const otplib = require('otplib')
const bcrypt = require('bcrypt')

const loginHelper = require('../../services/login')
const T = require('../../../time')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')
const authErrors = require('../errors/authentication')

const REMEMBER_ME_AGE = 90 * T.day

function authenticateUser(username, password) {
  return loginHelper.checkUser(username)
    .then(hashedPassword => {
      if (!hashedPassword) throw new authErrors.InvalidCredentialsError()
      return Promise.all([bcrypt.compare(password, hashedPassword), hashedPassword])
    })
    .then(([isMatch, hashedPassword]) => {
      if (!isMatch) throw new authErrors.InvalidCredentialsError()
      return loginHelper.validateUser(username, hashedPassword)
    })
    .catch(e => {
      console.error(e)
    })
}

const getUserData = context => {
  const lidCookie = context.req.cookies && context.req.cookies.lid
  if (!lidCookie) throw new authErrors.InvalidCredentialsError()

  const user = context.req.session.user
  return user
}

const get2FASecret = (username, password) => {
  return authenticateUser(username, password).then(user => {
    if (!user) throw new authErrors.InvalidCredentialsError()

    const secret = otplib.authenticator.generateSecret()
    const otpauth = otplib.authenticator.keyuri(username, 'Lamassu Industries', secret)
    return { secret, otpauth }
  })
}

const confirm2FA = (token, context) => {
  const requestingUser = context.req.session.user

  if (!requestingUser) throw new authErrors.InvalidCredentialsError()

  return users.get2FASecret(requestingUser.id).then(user => {
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
  return users.validatePasswordResetToken(token)
    .then(r => {
      if (!r.success) throw new authErrors.InvalidUrlError()
      return { id: r.userID }
    })
    .catch(err => console.error(err))
}

const validateReset2FALink = token => {
  if (!token) throw new authErrors.InvalidUrlError()
  return users.validate2FAResetToken(token)
    .then(r => {
      if (!r.success) throw new authErrors.InvalidUrlError()
      return users.findById(r.userID)
    })
    .then(user => {
      const secret = otplib.authenticator.generateSecret()
      const otpauth = otplib.authenticator.keyuri(user.username, 'Lamassu Industries', secret)
      return { user_id: user.id, secret, otpauth }
    })
    .catch(err => console.error(err))
}

const deleteSession = (sessionID, context) => {
  if (sessionID === context.req.session.id) {
    context.req.session.destroy()
  }
  return sessionManager.deleteSessionById(sessionID)
}

const login = (username, password) => {
  return authenticateUser(username, password).then(user => {
    if (!user) throw new authErrors.InvalidCredentialsError()
    return users.get2FASecret(user.id).then(user => {
      const twoFASecret = user.twofa_code
      return twoFASecret ? 'INPUT2FA' : 'SETUP2FA'
    })
  })
}

const input2FA = (username, password, rememberMe, code, context) => {
  return authenticateUser(username, password).then(user => {
    if (!user) throw new authErrors.InvalidCredentialsError()

    return users.get2FASecret(user.id).then(user => {
      const secret = user.twofa_code
      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()

      const finalUser = { id: user.id, username: user.username, role: user.role }
      context.req.session.user = finalUser
      if (rememberMe) context.req.session.cookie.maxAge = REMEMBER_ME_AGE

      return true
    })
  })
}

const setup2FA = (username, password, secret, codeConfirmation) => {
  return authenticateUser(username, password).then(user => {
    if (!user || !secret) throw new authErrors.InvalidCredentialsError()

    const isCodeValid = otplib.authenticator.verify({ token: codeConfirmation, secret: secret })
    if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()

    return users.save2FASecret(user.id, secret).then(() => true)
  })
}

const createResetPasswordToken = userID => {
  return users.findById(userID)
    .then(user => {
      if (!user) throw new authErrors.InvalidCredentialsError()
      return users.createResetPasswordToken(user.id)
    })
    .catch(err => console.error(err))
}

const createReset2FAToken = userID => {
  return users.findById(userID)
    .then(user => {
      if (!user) throw new authErrors.InvalidCredentialsError()
      return users.createReset2FAToken(user.id)
    })
    .catch(err => console.error(err))
}

const createRegisterToken = (username, role) => {
  return users.getByName(username)
    .then(user => {
      if (user) throw new authErrors.UserAlreadyExistsError()

      return users.createUserRegistrationToken(username, role)
    })
    .catch(err => console.error(err))
}

const register = (username, password, role) => {
  return users.getByName(username)
    .then(user => {
      if (user) throw new authErrors.UserAlreadyExistsError()
      return users.createUser(username, password, role).then(() => true)
    })
    .catch(err => console.error(err))
}

const resetPassword = (userID, newPassword, context) => {
  return users.findById(userID).then(user => {
    if (!user) throw new authErrors.InvalidCredentialsError()
    if (context.req.session.user && user.id === context.req.session.user.id) context.req.session.destroy()
    return users.updatePassword(user.id, newPassword)
  }).then(() => true).catch(err => console.error(err))
}

const reset2FA = (userID, token, secret, context) => {
  return users.findById(userID).then(user => {
    const isCodeValid = otplib.authenticator.verify({ token, secret })
    if (!isCodeValid) throw new authErrors.InvalidTwoFactorError()
    if (context.req.session.user && user.id === context.req.session.user.id) context.req.session.destroy()
    return users.save2FASecret(user.id, secret).then(() => true)
  }).catch(err => console.error(err))
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
  createResetPasswordToken,
  createReset2FAToken,
  createRegisterToken,
  register,
  resetPassword,
  reset2FA
}
