const { asyncLocalStorage } = require('./async-storage')
const logger = require('./logger')

const getSchema = () => {
  const store = asyncLocalStorage.getStore()
  return store ? store.get('schema') : null
}

const getDefaultSchema = () => {
  const store = asyncLocalStorage.getStore()
  return store.get('defaultSchema')
}

const schemaNotFound = query => {
  logger.error(`Schema for query '${query}' has not been found and the query has returned null`)
}

const any = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.any(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const none = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.none(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const one = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.one(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const oneOrNone = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.oneOrNone(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const manyOrNone = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.manyOrNone(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const many = (obj, query, variables) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.many(query, variables).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const result = (obj, query, variables, cb, thisArg) => {
  const schema = getSchema()
  if (!schema) throw new Error(schemaNotFound(query))
  return obj.taskEx({ schema }, t => {
    return t.result(query, variables, cb, thisArg).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const query = (obj, query, variables, qrm, throwOnError) => {
  const schema = getSchema()
  if (!schema) {
    if (throwOnError) throw new Error(schemaNotFound(query))
    return Promise.resolve(schemaNotFound(query))
  }
  return obj.taskEx({ schema }, t => {
    return t.query(query, variables, qrm).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

module.exports = {
  any,
  manyOrNone,
  none,
  many,
  oneOrNone,
  one,
  result,
  query
}
