const simpleWebauthn = require('@simplewebauthn/server')
const base64url = require('base64url')
const _ = require('lodash/fp')

const credentials = require('../../../../hardware-credentials')
const options = require('../../../../options')
const T = require('../../../../time')
const users = require('../../../../users')

const domain = options.hostname
const devMode = require('minimist')(process.argv.slice(2)).dev

const REMEMBER_ME_AGE = 90 * T.day

const rpID = devMode ? `localhost` : domain
const expectedOrigin = `https://${rpID}:3001`

const generateAttestationOptions = (session, options) => {
  return credentials.getHardwareCredentials().then(devices => {
    const opts = simpleWebauthn.generateAttestationOptions({
      rpName: 'Lamassu',
      rpID,
      userName: `Usernameless user created at ${new Date().toISOString()}`,
      userID: options.userId,
      timeout: 60000,
      attestationType: 'direct',
      excludeCredentials: devices.map(dev => ({
        id: dev.data.credentialID,
        type: 'public-key',
        transports: ['usb', 'ble', 'nfc', 'internal']
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'discouraged',
        requireResidentKey: false
      }
    })

    session.webauthn = {
      attestation: {
        challenge: opts.challenge
      }
    }

    return opts
  })
}

const generateAssertionOptions = session => {
  return credentials.getHardwareCredentials().then(devices => {
    const options = simpleWebauthn.generateAssertionOptions({
      timeout: 60000,
      allowCredentials: devices.map(dev => ({
        id: dev.data.credentialID,
        type: 'public-key',
        transports: ['usb', 'ble', 'nfc', 'internal']
      })),
      userVerification: 'discouraged',
      rpID
    })

    session.webauthn = {
      assertion: {
        challenge: options.challenge
      }
    }
    return options
  })
}

const validateAttestation = (session, options) => {
  const webauthnData = session.webauthn.attestation
  const expectedChallenge = webauthnData.challenge

  return Promise.all([
    users.getUserById(options.userId),
    simpleWebauthn.verifyAttestationResponse({
      credential: options.attestationResponse,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID
    })
  ])
    .then(([user, verification]) => {
      const { verified, attestationInfo } = verification

      if (!(verified || attestationInfo)) {
        session.webauthn = null
        return verified
      }

      const {
        fmt,
        counter,
        aaguid,
        credentialPublicKey,
        credentialID,
        credentialType,
        userVerified,
        attestationObject
      } = attestationInfo

      return credentials.getHardwareCredentialsByUserId(user.id)
        .then(userDevices => {
          const existingDevice = userDevices.find(device => device.data.credentialID === credentialID)

          if (!existingDevice) {
            const newDevice = {
              fmt,
              counter,
              aaguid,
              credentialPublicKey,
              credentialID,
              credentialType,
              userVerified,
              attestationObject
            }
            credentials.createHardwareCredential(user.id, newDevice)
          }

          session.webauthn = null
          return verified
        })
    })
}

const validateAssertion = (session, options) => {
  const expectedChallenge = session.webauthn.assertion.challenge

  return credentials.getHardwareCredentials().then(devices => {
    const dbAuthenticator = _.find(dev => {
      return Buffer.from(dev.data.credentialID).compare(base64url.toBuffer(options.assertionResponse.rawId)) === 0
    }, devices)

    if (!dbAuthenticator.data) {
      throw new Error(`Could not find authenticator matching ${options.assertionResponse.id}`)
    }

    const convertedAuthenticator = _.merge(
      dbAuthenticator.data,
      { credentialPublicKey: Buffer.from(dbAuthenticator.data.credentialPublicKey) }
    )

    let verification
    try {
      verification = simpleWebauthn.verifyAssertionResponse({
        credential: options.assertionResponse,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: convertedAuthenticator
      })
    } catch (err) {
      console.error(err)
      return false
    }

    const { verified, assertionInfo } = verification

    if (!verified) {
      session.webauthn = null
      return false
    }

    dbAuthenticator.data.counter = assertionInfo.newCounter
    return Promise.all([
      credentials.updateHardwareCredential(dbAuthenticator),
      users.getUserById(dbAuthenticator.user_id)
    ])
      .then(([_, user]) => {
        const finalUser = { id: user.id, username: user.username, role: user.role }
        session.user = finalUser
        session.cookie.maxAge = REMEMBER_ME_AGE
    
        session.webauthn = null
        return verified
      })    
  })
}

module.exports = {
  generateAttestationOptions,
  generateAssertionOptions,
  validateAttestation,
  validateAssertion
}
