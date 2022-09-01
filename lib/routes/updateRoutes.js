const express = require('express')
const _ = require('lodash')
const router = express.Router()
const fs = require('fs')
const httpError = require('../route-helpers').httpError
const { recordUpdateEvent, getUpdateStatus } = require('../machine-loader')

function update (req, res, next) {
  const deviceId = req.headers['device-id']

  const packageUrl = '/home/zepedro/.lamassu/packages/'
  const packageName = 'update.tar'
  const path = packageUrl + packageName
  var fileSize = fs.statSync(path).size

  getUpdateStatus(deviceId)
    .then(statuses => {
      const latestStatus = _.head(statuses)
      if (latestStatus.event !== 'requested') throw httpError('Update refused: internal device update status conflict!')
      return recordUpdateEvent(deviceId, 'inProgress')
    })
    .then(() => {
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
    })
    .catch(err => { throw httpError(`Update refused: ${err.message}!`) })
}

function complete (req, res, next) {
  const deviceId = req.body.deviceId
  getUpdateStatus(deviceId)
    .then(statuses => {
      const latestStatus = _.head(statuses)
      if (latestStatus.event !== 'inProgress') throw httpError('Failed to register update completion: internal device update status conflict!')
      return recordUpdateEvent(deviceId, 'successful')
    })
    .then(record => res.json({ updateStatus: record.event }))
    .catch(next)
}

router.get('/', update)
router.post('/complete', complete)

module.exports = router
