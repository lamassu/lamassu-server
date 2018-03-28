const db = require('./db')

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
  const sql = 'SELECT cassette1, cassette2 FROM devices ' +
    'WHERE device_id=$1'

  return db.one(sql, [deviceId])
    .then(row => {
      const counts = [row.cassette1, row.cassette2]
      return {counts}
    })
}

// Note: since we only prune on insert, we'll always have
// last known state.
exports.machineEvent = function machineEvent (rec) {
  const fields = ['id', 'device_id', 'event_type', 'note', 'device_time']
  const sql = getInsertQuery('machine_events', fields)
  const values = [rec.id, rec.deviceId, rec.eventType, rec.note, rec.deviceTime]

  const deleteSql = `delete from machine_events
  where device_id=$1
  and event_type=$2
  and created < now() - interval '2 days'`

  return db.none(sql, values)
    .then(() => db.none(deleteSql, [rec.deviceId, rec.eventType]))
}

exports.machineEvents = function machineEvents () {
  const sql = 'SELECT *, (EXTRACT(EPOCH FROM (now() - created))) * 1000 AS age FROM machine_events'

  return db.any(sql, [])
}
