const express = require('express')
const router = express.Router()
const fs = require('fs')
const httpError = require('../route-helpers').httpError
var accepted = true

function update (req, res, next) {
  if (!accepted) throw httpError('Update refused!')
  accepted = false
  const packageUrl = '/home/zepedro/.lamassu/packages/'
  const packageName = 'update.tar'
  const path = packageUrl + packageName
  var fileSize = fs.statSync(path).size

  res.writeHead(200, {
    'content-type': 'application/octet-stream',
    'content-disposition': 'attachment; filename=update.tar',
    'content-length': fileSize
  })

  var readStream = fs.createReadStream(path)
  console.log('********* Starting download... *********')
  readStream.pipe(res)
  readStream.on('end', () => {
    console.log('********* Download Completed! *********')
  })
  readStream.on('error', err => {
    console.log('********* ERROR: Download Failed! *********', err)
  })
}

router.get('/', update)

module.exports = router
