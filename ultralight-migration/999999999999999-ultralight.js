const db = require('./db')

exports.up = function (next) {
  const sql = [
    `CREATE TABLE ultralight.operators (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      schema TEXT NOT NULL UNIQUE
    )`,
    `CREATE TABLE ultralight.devices (
      id TEXT PRIMARY KEY,
      operator_id UUID REFERENCES ultralight.operators(id) NOT NULL
    )`,
    `CREATE TABLE ultralight.users (
      id UUID PRIMARY KEY,
      active BOOLEAN DEAFULT false,
      identifier TEXT NOT NULL UNIQUE,
      operator_id UUID REFERENCES ultralight.operators(id) NOT NULL
    )`,
    `CREATE TABLE ultralight.pairing_helper (
      token TEXT NOT NULL UNIQUE,
      operator_id UUID REFERENCES ultralight.operators(id) NOT NULL
    )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
