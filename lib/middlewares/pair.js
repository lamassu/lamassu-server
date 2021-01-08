const pairing = require('../pairing')

function pair (req, res, next) {
  console.log("pair")
  const token = req.query.token
  const deviceId = req.deviceId
  const model = req.query.model

  return pairing.pair(token, deviceId, model)
    .then(valid => {
      if (valid) {
        return res.json({ status: 'paired' })
      }

      throw httpError('Pairing failed')
    })
    .catch(next)
}

module.exports = pair