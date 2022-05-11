const pairing = require('../pairing')
const logger = require('../logger')

function ca (req, res) {
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
    .then(ca => res.json({ ca }))
    .catch(error => {
      logger.error(error.message)
      return res.status(403).json({ error: 'forbidden' })
    })
}

module.exports = ca
