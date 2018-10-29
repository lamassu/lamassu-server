const _ = require('lodash/fp')
const db = require('../lib/db')
const sequential = require('promise-sequential')

module.exports = {
  multi,
  defineEnum,
  dropEnum,
  renameEnum,
  alterColumn,
  addColumn,
  dropColumn,
  renameColumn,
  dropConstraint,
  addConstraint,
  addSequence,
  alterSequence
}

function multi (sqls, cb) {
  const doQuery = s => {
    return () => {
      return db.none(s)
        .catch(err => {
          console.log(err.stack)
          throw err
        })
    }
  }

  return sequential(sqls.map(doQuery))
    .then(() => cb())
    .catch(err => {
      console.log(err.stack)
      cb(err)
    })
}

function defineEnum (name, values) {
  return `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = '${name}'
  ) THEN
    CREATE TYPE '${name}' AS ENUM (${values});
  END IF;
END
`
}

function dropEnum (name) {
  return `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = '${name}'
  ) THEN
    DROP TYPE '${name}';
  END IF;
END
`
}

function renameEnum (name, newName) {
  return `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = '${name}'
  ) THEN
    ALTER TYPE '${name}' RENAME TO '${newName}';
  END IF;
END
`
}

function ifColumn (table, column, statement, not) {
  return `DO $$
BEGIN
  IF ${not ? 'NOT' : ''} EXISTS (
    SELECT NULL
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = '${table}'
      AND column_name = '${column}'
  ) THEN
    ${statement};
  END IF;
END
`
}

function alterColumn (table, column, change) {
  return ifColumn(table, column, `
  ALTER TABLE '${table}' 
    ALTER '${column}' ${change}`)
}

function addColumn (table, column, change) {
  return ifColumn(table, column, `
  ALTER TABLE '${table}' 
    ADD '${column}' ${change}`, true)
}

function dropColumn (table, column) {
  return ifColumn(table, column, `
  ALTER TABLE '${table}' 
    DROP '${column}'`)
}

function renameColumn (table, column, newName) {
  return ifColumn(table, column, `
  ALTER TABLE '${table}' 
    RENAME '${column}' to '${newName}'`)
}

function dropConstraint (table, column) {
  return 'IF EXISTS( ' +
    'SELECT NULL\n' +
    'FROM INFORMATION_SCHEMA.constraint_column_usage\n' +
    'WHERE constraint_name = \'' + column + '\'' +
    ') THEN\n' +
    '  ALTER TABLE `' + table + '` drop constraint ' + column + ';\n' +
    'END IF;'
}

function addConstraint (table, column, change) {
  return 'IF NOT EXISTS( ' +
    'SELECT NULL\n' +
    'FROM INFORMATION_SCHEMA.constraint_column_usage\n' +
    'WHERE constraint_name = \'' + column + '\'' +
    ') THEN\n' +
    '  ALTER TABLE `' + table + '` ADD CONSTRAINT `' + column + '` ' + change + ';\n' +
    'END IF;'
}

function addSequence (name, change) {
  return 'IF NOT EXISTS( ' +
    'SELECT NULL\n' +
    'FROM INFORMATION_SCHEMA.sequences\n' +
    'WHERE sequence_name = \'' + name + '\'' +
    ') THEN\n' +
    '  create sequence `' + name + '` ' + change + ';\n' +
    'END IF;'
}

function alterSequence (name, change) {
  return 'IF EXISTS( ' +
    'SELECT NULL\n' +
    'FROM INFORMATION_SCHEMA.sequences\n' +
    'WHERE sequence_name = \'' + name + '\'' +
    ') THEN\n' +
    '  alter sequence `' + name + '` ' + change + ';\n' +
    'END IF;'
}
