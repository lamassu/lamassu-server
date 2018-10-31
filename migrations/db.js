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
  alterSequence,
  ifColumn
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

function beginEnd (statement) {
  return `
  DO $$
  BEGIN
    ${statement};
  END $$
`
}

function defineEnum (name, values) {
  return beginEnd(`
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = '${name}'
    ) THEN
      CREATE TYPE ${name} AS ENUM (${values});
    END IF
  `)
}

function dropEnum (name) {
  return beginEnd(`
    IF EXISTS (
      SELECT 1 FROM pg_type WHERE typname = '${name}'
    ) THEN
      DROP TYPE ${name};
    END IF
  `)
}

function renameEnum (name, newName) {
  return beginEnd(`
    IF EXISTS (
      SELECT 1 FROM pg_type WHERE typname = '${name}'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${newName}'
      ) THEN
        ALTER TYPE ${name} RENAME TO ${newName};
      END IF;
    END IF
  `)
}

function ifColumn (table, column, statement, not, skipBeginEnd) {
  statement = `
    IF EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.TABLEs
      WHERE table_name = '${table}'
    ) THEN
      IF ${not ? 'NOT' : ''} EXISTS (
        SELECT NULL
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = '${table}'
          AND column_name = '${column}'
      ) THEN
        ${statement};
      END IF;
    END IF
  `
  return skipBeginEnd ? statement : beginEnd(statement)
}

function alterColumn (table, column, change) {
  return ifColumn(table, column, `
  ALTER TABLE ${table} 
    ALTER ${column} ${change}`)
}

function addColumn (table, column, change) {
  return ifColumn(table, column, `
  ALTER TABLE ${table} 
    ADD ${column} ${change}`, true)
}

function dropColumn (table, column) {
  return ifColumn(table, column, `
  ALTER TABLE ${table} 
    DROP ${column}`)
}

function renameColumn (table, column, newName) {
  return ifColumn(table, column,
    ifColumn(table, column, `
      ALTER TABLE ${table} 
        RENAME ${column} to ${newName}`, true, true))
}

function dropConstraint (table, column) {
  return beginEnd(`
    IF EXISTS( 
      SELECT NULL
        FROM INFORMATION_SCHEMA.constraint_column_usage
        WHERE constraint_name = '${column}'
      ) THEN
        ALTER TABLE ${table} DROP CONSTRAINT ${column};
    END IF
  `)
}

function addConstraint (table, column, change, refTable, refColumn) {
  return ifColumn(refTable, refColumn, `
    IF NOT EXISTS(
      SELECT NULL
        FROM INFORMATION_SCHEMA.constraint_column_usage
        WHERE constraint_name = '${column}'
      ) THEN
        ALTER TABLE ${table} ADD CONSTRAINT ${column} ${change};
    END IF
  `, false)
}

function addSequence (name, change) {
  return beginEnd(`
    IF NOT EXISTS(
      SELECT NULL
        FROM INFORMATION_SCHEMA.sequences
        WHERE sequence_name = '${name}'
      ) THEN
        CREATE SEQUENCE ${name} ${change};
    END IF
  `)
}

function alterSequence (name, change) {
  return beginEnd(`
    IF EXISTS(
        SELECT NULL
          FROM INFORMATION_SCHEMA.sequences
          WHERE sequence_name = '${name}'
      ) THEN
        ALTER SEQUENCE ${name} ${change};
    END IF
  `)
}
