const axios = require('axios')
const _ = require('lodash/fp')
const uuid = require('uuid')

const sendMessage = (settings, rec) => {
  const webhookUrl = process.env.WEBHOOK_URL

  if (_.isEmpty(webhookUrl)) return Promise.resolve()

  const body = _.merge(rec.webhook, { id: uuid.v4() })

  return axios({
    method: 'POST',
    url: webhookUrl,
    data: body
  })
}

module.exports = {
  sendMessage
}
