const logger = require('../../logger')
const sanctions = require('../../ofac')

const sanctionStatus = {
  loaded: false,
  timestamp: null
}

const loadSanctionLists = (req, res, next) => {
  if (!sanctionStatus.loaded) {
    logger.info('No sanction lists loaded. Loading sanctions...')
    return sanctions.load()
      .then(() => {
        logger.info('OFAC sanction list loaded!')
        sanctionStatus.loaded = true
        sanctionStatus.timestamp = Date.now()
        return next()
      })
      .catch(e => {
        logger.error('Couldn\'t load OFAC sanction list!')
        return next(e)
      })
  }

  return next()
}

module.exports = loadSanctionLists
