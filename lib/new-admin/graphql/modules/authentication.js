const simpleWebauthn = require('@simplewebauthn/server')
const otplib = require('otplib')
const bcrypt = require('bcrypt')

const loginHelper = require('../../login')
const T = require('../../../time')
const users = require('../../../users')
const sessionManager = require('../../../session-manager')

const REMEMBER_ME_AGE = 90 * T.day

function authenticateUser (username, password) {
  return loginHelper.checkUser(username).then(hashedPassword => {
    if (!hashedPassword) return null
    return Promise.all([bcrypt.compare(password, hashedPassword), hashedPassword])
  }).then(([isMatch, hashedPassword]) => {
    if (!isMatch) return null
    return loginHelper.validateUser(username, hashedPassword)
  }).then(user => {
    if (!user) return null
    return user
  }).catch(e => {
    console.error(e)
  })
}

const getUserData = context => {
  const lidCookie = context.req.cookies && context.req.cookies.lid
  if (!lidCookie) return null

  const user = context.req.session.user
  return user
}

const get2FASecret = (username, password) => {
  return authenticateUser(username, password).then(user => {
    if (!user) return null

    const secret = otplib.authenticator.generateSecret()
    const otpauth = otplib.authenticator.keyuri(username, 'Lamassu Industries', secret)
    return { secret, otpauth }
  })
}

const confirm2FA = (codeArg, context) => {
  const code = codeArg
  const requestingUser = context.req.session.user

  if (!requestingUser) return false

  return users.get2FASecret(requestingUser.id).then(user => {
    const secret = user.twofa_code
    const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })

    if (!isCodeValid) return false
    return true
  })
}

const validateRegisterLink = token => {
  if (!token) return null
  return users.validateUserRegistrationToken(token)
    .then(r => {
      if (!r.success) return null
      return { username: r.username, role: r.role }
    })
    .catch(err => console.error(err))
}

const validateResetPasswordLink = token => {
  if (!token) return null
  return users.validatePasswordResetToken(token)
    .then(r => {
      if (!r.success) return null
      return { id: r.userID }
    })
    .catch(err => console.error(err))
}

const validateReset2FALink = token => {
  if (!token) return null
  return users.validate2FAResetToken(token)
    .then(r => {
      if (!r.success) return null
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
  return sessionManager.deleteSession(sessionID)
}

const login = (username, password) => {
  return authenticateUser(username, password).then(user => {
    if (!user) return 'FAILED'
    return users.get2FASecret(user.id).then(user => {
      const twoFASecret = user.twofa_code
      return twoFASecret ? 'INPUT2FA' : 'SETUP2FA'
    })
  })
}

const input2FA = (username, password, rememberMe, code, context) => {
  return authenticateUser(username, password).then(user => {
    if (!user) return false

    return users.get2FASecret(user.id).then(user => {
      const secret = user.twofa_code
      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) return false

      const finalUser = { id: user.id, username: user.username, role: user.role }
      context.req.session.user = finalUser
      if (rememberMe) context.req.session.cookie.maxAge = REMEMBER_ME_AGE

      return true
    })
  })
}

const setup2FA = (username, password, secret, codeConfirmation) => {
  return authenticateUser(username, password).then(user => {
    if (!user || !secret) return false

    const isCodeValid = otplib.authenticator.verify({ token: codeConfirmation, secret: secret })
    if (!isCodeValid) return false

    users.save2FASecret(user.id, secret)
    return true
  })
}

const createResetPasswordToken = userID => {
  return users.findById(userID)
    .then(user => {
      if (!user) return null
      return users.createResetPasswordToken(user.id)
    })
    .then(token => {
      return token
    })
    .catch(err => console.error(err))
}

const createReset2FAToken = userID => {
  return users.findById(userID)
    .then(user => {
      if (!user) return null
      return users.createReset2FAToken(user.id)
    })
    .then(token => {
      return token
    })
    .catch(err => console.error(err))
}

const createRegisterToken = (username, role) => {
  return users.getByName(username)
    .then(user => {
      if (user) return null

      return users.createUserRegistrationToken(username, role).then(token => {
        return token
      })
    })
    .catch(err => console.error(err))
}

const register = (username, password, role) => {
  return users.getByName(username)
    .then(user => {
      if (user) return false

      users.createUser(username, password, role)
      return true
    })
    .catch(err => console.error(err))
}

const resetPassword = (userID, newPassword, context) => {
  return users.findById(userID).then(user => {
    if (!user) return false
    if (context.req.session.user && user.id === context.req.session.user.id) context.req.session.destroy()
    return users.updatePassword(user.id, newPassword)
  }).then(() => { return true }).catch(err => console.error(err))
}

const reset2FA = (userID, code, secret, context) => {
  return users.findById(userID).then(user => {
    const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
    if (!isCodeValid) return false

    if (context.req.session.user && user.id === context.req.session.user.id) context.req.session.destroy()
    return users.save2FASecret(user.id, secret).then(() => { return true })
  }).catch(err => console.error(err))
}

const rpID = `localhost`
const expectedOrigin = `https://${rpID}:3001`

const generateAttestationOptions = (userID) => {
  return users.findById(userID).then(user => {
    const options = simpleWebauthn.generateAttestationOptions({
      rpName: 'Lamassu',
      rpID,
      userName: user.username,
      userID: user.id,
      timeout: 60000,
      attestationType: 'indirect',
      excludeCredentials: [],
      authenticatorSelection: {
        userVerification: 'preferred',
        requireResidentKey: false
      }
    })

    try {
      !user.hardware_credentials
        ? users.initializeHardwareCredentials(user.id, options.challenge)
        : users.updateHardwareCredentialChallenge(user.id, options.challenge)
    } catch (e) {
      throw new Error(`An error occurred when updating challenge for user ${user.id}`)
    }

    return options
  })
}

const generateAssertionOptions = (username, password) => {
  return authenticateUser(username, password).then(user => {
    const userDevices = users.getHardwareDevices(user.id).then(devices => {
      return JSON.parse(devices)
    })

    const options = simpleWebauthn.generateAssertionOptions({
      timeout: 60000,
      allowCredentials: userDevices.map(dev => ({
        id: dev.credentialID,
        type: 'public-key',
        transports: ['usb', 'ble', 'nfc', 'internal']
      })),
      userVerification: 'preferred',
      rpID
    })

    users.updateHardwareCredentialChallenge(user.id, options.challenge)

    return options
  })
}

const validateAttestation = (userID, attestationResponse) => {
  const expectedChallenge = users.getCurrentChallenge(userID).then(res => {
    return res.challenge
  })

  return simpleWebauthn.verifyAttestationResponse({
    credential: JSON.parse(attestationResponse),
    expectedChallenge: `${expectedChallenge}`,
    expectedOrigin,
    expectedRPID: rpID
  }).then(async verification => {
    const { verified, authenticatorInfo } = verification

    if (verified && authenticatorInfo) {
      const { base64PublicKey, base64CredentialID, counter } = authenticatorInfo

      const userDevices = JSON.parse((await users.getHardwareDevices(userID)).devices)
      const existingDevice = userDevices.find(device => device.credentialID === base64CredentialID)

      if (!existingDevice) {
        const newDevice = {
          publicKey: base64PublicKey,
          credentialID: base64CredentialID,
          counter
        }
        userDevices.push(newDevice)
        await users.saveHardwareDevices(userID, userDevices)
      }
    }

    return verified
  })
}

const validateAssertion = (username, password, rememberMe, assertionResponse, context) => {
  return authenticateUser(username, password).then(user => {
    const assertionResponseObj = JSON.parse(assertionResponse)
    const expectedChallenge = users.getCurrentChallenge(user.id).then(res => {
      return res.challenge
    })

    const userDevices = users.getHardwareDevices(user.id).then(devices => {
      return JSON.parse(devices)
    })

    const dbAuthenticator = _.find(userDevices, dev => {
      return dev.credentialID === assertionResponseObj.id
    })

    if (!dbAuthenticator) {
      throw new Error(`could not find authenticator matching ${assertionResponseObj.id}`)
    }

    const verification = simpleWebauthn.verifyAssertionResponse({
      credential: assertionResponseObj,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: dbAuthenticator
    })

    const { verified, authenticatorInfo } = verification

    if (verified) {
      dbAuthenticator.counter = authenticatorInfo.counter
      users.saveHardwareDevices(user.id, userDevices)

      const finalUser = { id: user.id, username: user.username, role: user.role }
      context.req.session.user = finalUser
      if (rememberMe) context.req.session.cookie.maxAge = REMEMBER_ME_AGE
    }

    return verified
  })
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
  reset2FA,
  generateAttestationOptions,
  generateAssertionOptions,
  validateAttestation,
  validateAssertion
}
