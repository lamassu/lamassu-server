const express = require('express')
const router = express.Router()
const fs = require('fs')
const httpError = require('../route-helpers').httpError

function update (req, res, next) {
  const accepted = req.body.updateAcceptance
  if (!accepted) throw httpError('Update refused!')
  const packageUrl = '/home/zepedro/.lamassu/packages/'
  const packageName = 'update.tar'
  const path = packageUrl + packageName
  var fileSize = fs.statSync(path).size

  res.status(200).json({
    'content-type': 'application/gzip',
    'content-disposition': 'attachment; filename=update.tar',
    'content-length': fileSize
  })

  var readStream = fs.createReadStream(path)
  readStream.pipe(res)
  readStream.on('end', () => {
    console.log('********* Download Completed! *********')
  })
  readStream.on('err', err => {
    console.log('ERROR: Download Failed! ', err)
  })
}

router.get('/', update)

module.exports = router
