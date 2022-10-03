const express = require('express')
const axios = require('axios')
const _ = require('lodash')
const router = express.Router()
const httpError = require('../route-helpers').httpError
const { recordUpdateEvent, getUpdateStatuses } = require('../machine-loader')
const updateInfo = require('../../manifest.json')

function update (req, res, next) {
  const deviceId = req.headers['device-id']

  getUpdateStatuses(deviceId)
    .then(statuses => {
      const latestStatus = _.head(statuses)
      if (latestStatus.event !== 'requested') {
        const message = `Update refused: internal device update status conflict!`
        recordUpdateEvent(deviceId, 'error', message)
          .then(() => {
            throw httpError(message)
          })
      }
      return recordUpdateEvent(deviceId, 'inProgress', `Downloading new update package...`)
    })
    .then(() => {
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename=update.tar'
      })

      axios({
        method: 'GET',
        url: updateInfo.package.url,
        responseType: 'stream'
      }).then(function (response) {
        console.log('********* Downloading package... *********')
        response.data.pipe(res)
        response.data.on('end', () => {
          console.log('********* Download Completed! *********')
        })
        response.data.on('error', err => {
          console.log('********* ERROR: Download Failed! *********', err)
        })
      })
    })
    .catch(err => {
      recordUpdateEvent(deviceId, 'error', `Update refused: ${err.message}`)
        .then(() => {
          throw httpError(`Update refused: ${err.message}!`)
        })
    })
}

function complete (req, res, next) {
  const deviceId = req.body.deviceId
  getUpdateStatuses(deviceId)
    .then(statuses => {
      const latestStatus = _.head(statuses)
      if (latestStatus.event !== 'inProgress') {
        const message = 'Failed to register update completion: internal device update status conflict!'
        recordUpdateEvent(deviceId, 'error', message)
          .then(() => {
            throw httpError(message)
          })
      }
      return recordUpdateEvent(deviceId, 'successful', `The update ended successfully!`)
    })
    .then(record => res.json({ updateStatus: record.event }))
    .catch(next)
}

router.get('/', update)
router.post('/complete', complete)

module.exports = router
