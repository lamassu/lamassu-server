const pairing = require('../pairing')

function ca (req, res) {
  console.log("ca")
  const token = req.query.token

  return pairing.authorizeCaDownload(token)
    .then(ca => res.json({ ca }))
    .catch(() => res.status(403).json({ error: 'forbidden' }))
}

module.exports = ca