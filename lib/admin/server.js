const moment = require('moment')

const ticker = require('../ticker')
const settingsLoader = require('../settings-loader')

const db = require('../db')

const CONSIDERED_UP_SECS = 30

function machinesLastPing () {
  const sql = `select name, min(extract(epoch from (now() - machine_events.created))) as age
  from machine_events, devices
  where machine_events.device_id = devices.device_id
  and devices.paired
  group by name`

  return db.any(sql)
  .then(r => {
    if (r.length === 0) return 'No paired machines'

    const downRows = r.filter(row => row.age > CONSIDERED_UP_SECS)
    if (downRows.length === 0) return 'All machines are up'

    if (downRows.length === 1) {
      const row = downRows[0]
      const age = moment.duration(row.age, 'seconds')
      return `${row.name} down for ${age.humanize()}`
    }

    return 'Multiple machines down'
  })
}

function status () {
  const sql = `select extract(epoch from (now() - created)) as age
  from server_events
  where event_type=$1
  order by created desc
  limit 1`

  return Promise.all([db.oneOrNone(sql, ['ping']), machinesLastPing()])
  .then(([statusRow, machineStatus]) => {
    const age = statusRow && moment.duration(statusRow.age, 'seconds')
    const up = statusRow ? statusRow.age < CONSIDERED_UP_SECS : false
    const lastPing = statusRow && age.humanize()

    return settingsLoader.loadLatest()
    .catch(() => null)
    .then(settings => {
      return getRates(settings)
      .then(rates => ({up, lastPing, rates, machineStatus}))
    })
  })
}

function getRates (settings) {
  if (!settings) return Promise.resolve([])

  return ticker.getRates(settings, 'USD', 'BTC')
  .then(ratesRec => {
    return [{
      crypto: 'BTC',
      bid: parseFloat(ratesRec.rates.bid),
      ask: parseFloat(ratesRec.rates.ask)
    }]
  })
  .catch(() => [])
}

module.exports = {status}
