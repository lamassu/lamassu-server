const _ = require('lodash/fp')

const concatSchema = (qry, tables) => {
  const schemaName = 'public' // fetch schema name from Async Local Storage here
  let query = qry
  _.forEach(tableName => { query = query.replace(tableName, `${schemaName}.${tableName}`) }, tables)
  return query
}

const any = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.any(query, variables)
}

const manyOrNone = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.manyOrNone(query, variables)
}

const none = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.none(query, variables)
}

const many = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.many(query, variables)
}

const oneOrNone = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.oneOrNone(query, variables)
}

const one = (db, dbContext, qry, tables, variables) => {
  const query = concatSchema(qry, tables)
  return db.one(query, variables)
}

const result = (db, dbContext, qry, tables, variables, cb) => {
  const query = concatSchema(qry, tables)
  console.log(query)
  return db.result(query, variables).then(r => {
    return cb ? cb(r) : r
  })
}

module.exports = {
  any,
  manyOrNone,
  none,
  many,
  oneOrNone,
  one,
  result
}
