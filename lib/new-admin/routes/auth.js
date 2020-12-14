const express = require('express')
const router = express.Router()

const getUserData = function (req, res, next) {
  const lidCookie = req.cookies && req.cookies.lid
  if (!lidCookie) {
    res.sendStatus(403)
    return
  }

  const user = req.session.user
  return res.status(200).json({ message: 'Success', user: user })
}

router.get('/user-data', getUserData)

module.exports = router
