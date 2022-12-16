const axios = require('axios')
const _ = require('lodash/fp')
const uuid = require('uuid')

const WEBHOOK_URL = process.env.WEBHOOK_URL

const sendMessage = (settings, rec) => {
  if (_.isEmpty(WEBHOOK_URL)) return Promise.resolve()

  const body = _.merge(rec.webhook, { id: uuid.v4() })

  return axios({
    method: 'POST',
    url: WEBHOOK_URL,
    data: body
  })
}

module.exports = {
  sendMessage
}
