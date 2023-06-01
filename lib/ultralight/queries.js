const db = require('../meta-db')
const _ = require('lodash/fp')

const { v4 } = require('uuid')

function getOperatorIdFromDeviceId (deviceId) {
  const sql = 'SELECT operator_id FROM devices where id = $1'
  return db.oneOrNone(sql, [deviceId])
    .then(_.get('operator_id'))
}

function getSchemaFromDeviceId (deviceId) {
  const sql = 'SELECT o.schema FROM devices as d JOIN operators as o ON o.id = d.operator_id WHERE d.id = $1'
  return db.oneOrNone(sql, [deviceId])
    .then(_.get('schema'))
}

function getOperatorIdFromIdentifier (identifier) {
  return db.oneOrNone('SELECT operator_id FROM users WHERE identifier = $1', [identifier])
    .then(_.get('operator_id'))
}

function getSchemaFromIdentifier (identifier) {
  return db.oneOrNone('SELECT o.schema FROM users as u JOIN operators as o ON o.id = u.operator_id WHERE u.identifier = $1', [identifier])
    .then(_.get('schema'))
}

const createUser = (username, operatorId) => {
  return db.none(
    'INSERT INTO users (id, identifier, operator_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [v4(), username, operatorId]
  )
}

const registerUser = username => {
  return db.none('UPDATE users SET active = true WHERE identifier = $1', [username])
}

const createPairingToken = (token1, token2, operatorId) => {
  const sql = 'insert into pairing_helper (token, operator_id) values ($1, $3), ($2, $3)'
  return db.none(sql, [token1, token2, operatorId])
}

const getOperatorFromToken = (token) => {
  return db.oneOrNone('SELECT o.* from pairing_helper AS p JOIN operators as o ON o.id = p.operator_id where p.token = $1', [token])
}

const createOperator = (operatorId, name, schema) => {
  return db.tx(t => {
    return t.none('INSERT INTO operators (id, name, schema) VALUES ($1, $2, $3)', [operatorId, name, schema])
      .then(t.none(`create schema ${schema}`))
  })
}

const insertDevice = (id, operatorId) => {
  return db.none('INSERT INTO devices (id, operator_id) VALUES ($1, $2)', [id, operatorId])
}

const removeDevice = (id) => {
  return db.none('DELETE from devices where id = $1', [id])
}

const getSchemas = () => {
  const mapToString = _.map(_.get('schema'))
  return db.many('SELECT schema from operators').then(mapToString)
}

module.exports = {
  getOperatorIdFromDeviceId,
  getSchemaFromDeviceId,
  getOperatorIdFromIdentifier,
  getSchemaFromIdentifier,
  createUser,
  registerUser,
  createOperator,
  createPairingToken,
  getOperatorFromToken,
  insertDevice,
  removeDevice,
  getSchemas
}
