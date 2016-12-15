const moment = require('moment')

const ticker = require('../ticker')
const settingsLoader = require('../settings-loader')

const db = require('../db')

const CONSIDERED_UP = 30000

function status () {
  const sql = `select extract(epoch from (now() - created)) as age
  from server_events
  where event_type=$1
  order by created desc
  limit 1`

  return db.oneOrNone(sql, ['ping'])
  .then(row => {
    if (!row) return {up: false, lastPing: null}

    const age = moment.duration(row.age, 'seconds')
    const up = age.asMilliseconds() < CONSIDERED_UP
    const lastPing = age.humanize()

    return settingsLoader.loadLatest()
    .then(settings => {
      return ticker.getRates(settings, 'USD', 'BTC')
      .then(ratesRec => {
        const rates = [{
          crypto: 'BTC',
          bid: parseFloat(ratesRec.rates.bid),
          ask: parseFloat(ratesRec.rates.ask)
        }]
        console.log('DEBUG76: %j', ratesRec.rates)
        console.log('DEBUG77: %j', rates)
        return {up, lastPing, rates}
      })
    })
  })
}

module.exports = {status}
