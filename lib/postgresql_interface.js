const _ = require('lodash/fp')
const db = require('./db')
const pgp = require('pg-promise')()

function getInsertQuery (tableName, fields) {
  // outputs string like: '$1, $2, $3...' with proper No of items
  const placeholders = fields.map(function (_, i) {
    return '$' + (i + 1)
  }).join(', ')

  const query = 'INSERT INTO ' + tableName +
    ' (' + fields.join(', ') + ')' +
    ' VALUES' +
    ' (' + placeholders + ')'

  return query
}

exports.recordDeviceEvent = function recordDeviceEvent (deviceId, event) {
  const sql = 'INSERT INTO device_events (device_id, event_type, ' +
    'note, device_time) VALUES ($1, $2, $3, $4)'
  const values = [deviceId, event.eventType, event.note,
    event.deviceTime]

  return db.none(sql, values)
}

exports.cassetteCounts = function cassetteCounts (deviceId) {
  const sql = 'SELECT cassette1, cassette2, cassette3, cassette4, number_of_cassettes FROM devices ' +
    'WHERE device_id=$1'

  return db.one(sql, [deviceId])
    .then(row => {
      const counts = []
      _.forEach(it => {
        counts.push(row[`cassette${it + 1}`])
      }, _.times(_.identity(), row.number_of_cassettes))

      return { numberOfCassettes: row.number_of_cassettes, counts }
    })
}

// Note: since we only prune on insert, we'll always have
// last known state.
exports.machineEvent = function machineEvent (rec) {
  const fields = ['id', 'device_id', 'event_type', 'note', 'device_time']
  const sql = getInsertQuery('machine_events', fields)
  const values = [rec.id, rec.deviceId, rec.eventType, rec.note, rec.deviceTime]

  const deleteSql = `delete from machine_events
  where created < now() - interval '1 days'`

  return db.none(sql, values)
    .then(() => db.none(deleteSql))
}

exports.machineEventsByIdBatch = function machineEventsByIdBatch (machineIds) {
  const formattedIds = _.map(pgp.as.text, machineIds).join(',')
  const sql = `SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events WHERE device_id IN ($1^) ORDER BY age ASC LIMIT 1`
  return db.any(sql, [formattedIds]).then(res => {
    const events = _.map(_.mapKeys(_.camelCase))(res)
    const eventMap = _.groupBy('deviceId', events)
    return machineIds.map(id => _.prop([0], eventMap[id]))
  })
}

exports.machineEvents = function machineEvents () {
  const sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events'

  return db.any(sql, [])
}
