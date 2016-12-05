const moment = require('moment')

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

    return {up, lastPing}
  })
}

module.exports = {status}
