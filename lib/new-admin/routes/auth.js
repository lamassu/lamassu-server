const otplib = require('otplib')
const bcrypt = require('bcrypt')

const users = require('../../users')
const login = require('../login')

async function isValidUser (username, password) {
  const hashedPassword = await login.checkUser(username)
  if (!hashedPassword) return false

  const isMatch = await bcrypt.compare(password, hashedPassword)
  if (!isMatch) return false

  const user = await login.validateUser(username, hashedPassword)
  if (!user) return false
  return user
}

module.exports = function (app) {
  app.post('/api/login', function (req, res, next) {
    const usernameInput = req.body.username
    const passwordInput = req.body.password

    isValidUser(usernameInput, passwordInput).then(user => {
      if (!user) return res.sendStatus(403)
      users.get2FASecret(user.id).then(user => {
        const twoFASecret = user.twofa_code
        if (twoFASecret) return res.status(200).json({ message: 'INPUT2FA' })
        if (!twoFASecret) return res.status(200).json({ message: 'SETUP2FA' })
      })
    })
  })

  app.post('/api/login/2fa', function (req, res, next) {
    const code = req.body.twoFACode
    const username = req.body.username
    const password = req.body.password
    const rememberMeInput = req.body.rememberMe

    isValidUser(username, password).then(user => {
      if (!user) return res.sendStatus(403)

      users.get2FASecret(user.id).then(user => {
        const secret = user.twofa_code
        const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
        if (!isCodeValid) return res.sendStatus(403)

        const finalUser = { id: user.id, username: user.username, role: user.role }
        req.session.user = finalUser
        if (rememberMeInput) req.session.cookie.maxAge = 90 * 24 * 60 * 60 * 1000 // 90 days

        return res.sendStatus(200)
      })
    })
  })

  app.post('/api/login/2fa/setup', function (req, res, next) {
    const username = req.body.username
    const password = req.body.password

    // TODO: maybe check if the user already has a 2fa secret
    isValidUser(username, password).then(user => {
      if (!user) return res.sendStatus(403)

      const secret = otplib.authenticator.generateSecret()
      const otpauth = otplib.authenticator.keyuri(username, 'Lamassu Industries', secret)
      return res.status(200).json({ secret, otpauth })
    })
  })

  app.post('/api/login/2fa/save', function (req, res, next) {
    const username = req.body.username
    const password = req.body.password
    const secret = req.body.secret
    const code = req.body.code

    isValidUser(username, password).then(user => {
      if (!user || !secret) return res.sendStatus(403)

      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) return res.sendStatus(403)

      users.save2FASecret(user.id, secret)
      return res.sendStatus(200)
    })
  })

  app.get('/user-data', function (req, res, next) {
    const lidCookie = req.cookies && req.cookies.lid
    if (!lidCookie) {
      res.sendStatus(403)
      return
    }

    const user = req.session.user
    return res.status(200).json({ message: 'Success', user: user })
  })

  app.post('/api/resetpassword', function (req, res, next) {
    const userID = req.body.userID

    users.findById(userID)
      .then(user => {
        if (!user) return res.sendStatus(403)
        return users.createResetPasswordToken(user.id)
      })
      .then(token => {
        return res.status(200).json({ token })
      })
      .catch(err => console.log(err))
  })

  app.get('/api/resetpassword', function (req, res, next) {
    const token = req.query.t

    if (!token) return res.sendStatus(400)
    return users.validatePasswordResetToken(token)
      .then(r => {
        if (!r.success) return res.status(200).send('The link has expired')
        return res.status(200).json({ userID: r.userID })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.post('/api/updatepassword', function (req, res, next) {
    const userID = req.body.userID
    const newPassword = req.body.newPassword

    users.findById(userID).then(user => {
      if (req.session.user && user.id === req.session.user.id) req.session.destroy()
      return users.updatePassword(user.id, newPassword)
    }).then(() => {
      res.sendStatus(200)
    }).catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
  })

  app.post('/api/reset2fa', function (req, res, next) {
    const userID = req.body.userID

    users.findById(userID)
      .then(user => {
        if (!user) return res.sendStatus(403)
        return users.createReset2FAToken(user.id)
      })
      .then(token => {
        return res.status(200).json({ token })
      })
      .catch(err => console.log(err))
  })

  app.get('/api/reset2fa', function (req, res, next) {
    const token = req.query.t

    if (!token) return res.sendStatus(400)
    return users.validate2FAResetToken(token)
      .then(r => {
        if (!r.success) return res.status(200).send('The link has expired')
        return users.findById(r.userID)
      })
      .then(user => {
        const secret = otplib.authenticator.generateSecret()
        const otpauth = otplib.authenticator.keyuri(user.username, 'Lamassu Industries', secret)
        return res.status(200).json({ userID: user.id, secret, otpauth })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.post('/api/update2fa', function (req, res, next) {
    const userID = req.body.userID
    const secret = req.body.secret
    const code = req.body.code

    users.findById(userID).then(user => {
      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) return res.sendStatus(401)

      if (req.session.user && user.id === req.session.user.id) req.session.destroy()
      users.save2FASecret(user.id, secret).then(() => { return res.sendStatus(200) })
    }).catch(err => {
      console.log(err)
      return res.sendStatus(400)
    })
  })

  app.post('/api/createuser', function (req, res, next) {
    const username = req.body.username
    const role = req.body.role

    users.getByName(username)
      .then(user => {
        if (user) return res.status(200).json({ message: 'User already exists!' })

        users.createUserRegistrationToken(username, role).then(token => {
          return res.status(200).json({ token })
        })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.get('/api/register', function (req, res, next) {
    const token = req.query.t

    if (!token) return res.sendStatus(400)
    users.validateUserRegistrationToken(token)
      .then(r => {
        if (!r.success) return res.status(200).json({ message: 'The link has expired' })
        return res.status(200).json({ username: r.username, role: r.role })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.post('/api/register', function (req, res, next) {
    const username = req.body.username
    const password = req.body.password
    const role = req.body.role

    users.getByName(username)
      .then(user => {
        if (user) return res.status(200).json({ message: 'User already exists!' })

        users.createUser(username, password, role)
        res.sendStatus(200)
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.post('/api/confirm2fa', function (req, res, next) {
    const code = req.body.code
    const requestingUser = req.session.user

    if (!requestingUser) return res.status(403)

    users.get2FASecret(requestingUser.id).then(user => {
      const secret = user.twofa_code
      const isCodeValid = otplib.authenticator.verify({ token: code, secret: secret })
      if (!isCodeValid) return res.sendStatus(401)

      return res.sendStatus(200)
    })
  })
}
