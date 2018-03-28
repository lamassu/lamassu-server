const _ = require('lodash/fp')
const moment = require('moment')

const ticker = require('../ticker')
const settingsLoader = require('../settings-loader')

const db = require('../db')
const machineLoader = require('../machine-loader')

const CONSIDERED_UP_SECS = 30

function checkWasConfigured () {
  return settingsLoader.loadLatest()
    .then(() => true)
    .catch(() => false)
}

function machinesLastPing () {
  const sql = `select min(extract(epoch from (now() - created))) as age
  from machine_events
  group by device_id`

  return Promise.all([machineLoader.getMachineNames(), db.any(sql)])
    .then(([machines, events]) => {
      if (machines.length === 0) return 'No paired machines'

      const addName = event => {
        const machine = _.find(['deviceId', event.deviceId], machines)
        if (!machine) return null
        return _.set('name', machine.name, event)
      }

      const mapper = _.flow(_.filter(row => row.age > CONSIDERED_UP_SECS), _.map(addName), _.compact)
      const downRows = mapper(events)

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

  return Promise.all([checkWasConfigured(), db.oneOrNone(sql, ['ping']), machinesLastPing()])
    .then(([wasConfigured, statusRow, machineStatus]) => {
      const age = statusRow && moment.duration(statusRow.age, 'seconds')
      const up = statusRow ? statusRow.age < CONSIDERED_UP_SECS : false
      const lastPing = statusRow && age.humanize()

      return settingsLoader.loadLatest()
        .catch(() => null)
        .then(settings => {
          return getRates(settings)
            .then(rates => ({wasConfigured, up, lastPing, rates, machineStatus}))
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
