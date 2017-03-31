const db = require('../db')
const pairing = require('./pairing')

function getMachines () {
  return db.any('select * from devices where display=TRUE order by name')
  .then(rr => rr.map(r => ({
    deviceId: r.device_id,
    name: r.name,
    cashbox: r.cashbox,
    cassette1: r.cassette1,
    cassette2: r.cassette2,
    paired: r.paired
  })))
}

function resetCashOutBills (rec) {
  const sql = 'update devices set cassette1=$1, cassette2=$2 where device_id=$3'
  return db.none(sql, [rec.cassettes[0], rec.cassettes[1], rec.deviceId])
}

function unpair (rec) {
  return pairing.unpair(rec.deviceId)
}

function setMachine (rec) {
  switch (rec.action) {
    case 'resetCashOutBills': return resetCashOutBills(rec)
    case 'unpair': return unpair(rec)
    default: throw new Error('No such action: ' + rec.action)
  }
}

module.exports = {getMachines, setMachine}
