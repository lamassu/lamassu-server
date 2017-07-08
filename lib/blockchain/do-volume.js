const fs = require('fs')

const options = require('../options')

const common = require('./common')

const MOUNT_POINT = options.blockchainDir

module.exports = {prepareVolume}

const logger = common.logger

function isMounted () {
  return fs.existsSync(MOUNT_POINT)
}

function isFormatted (volumePath) {
  const res = common.es(`file --dereference -s ${volumePath}`).trim()
  return res !== `${volumePath}: data`
}

function formatVolume (volumePath) {
  if (isFormatted(volumePath)) {
    logger.info('Volume is already formatted.')
    return
  }

  logger.info('Formatting...')
  common.es(`sudo mkfs.ext4 ${volumePath}`)
}

function mountVolume (volumePath) {
  if (isMounted()) {
    logger.info('Volume is already mounted.')
    return
  }

  logger.info('Mounting...')
  common.es(`sudo mkdir -p ${MOUNT_POINT}`)
  common.es(`sudo mount -o discard,defaults ${volumePath} ${MOUNT_POINT}`)
  common.es(`echo ${volumePath} ${MOUNT_POINT} ext4 defaults,nofail,discard 0 0 | sudo tee -a /etc/fstab`)
}

function locateVolume () {
  const res = common.es('ls /dev/disk/by-id/*')
  const lines = res.trim().split('\n')

  if (lines.length > 1) {
    logger.error('More than one volume present, cannot prepare.')
    return null
  }

  if (lines.length === 0) {
    logger.error('No available volumes. You might need to attach one.')
    return null
  }

  return lines[0].trim()
}

function prepareVolume () {
  if (isMounted()) {
    logger.info('Volume is already mounted.')
    return true
  }

  const volumePath = locateVolume()
  if (!volumePath) return false

  formatVolume(volumePath)
  mountVolume(volumePath)

  return true
}
