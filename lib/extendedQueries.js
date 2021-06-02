const logger = require('./logger')

// TODO use asynclocalstorage
const getSchema = () => {
  return 'public'
}

const getDefaultSchema = () => {
  return 'ERROR_SCHEMA'
}

const schemaNotFound = query => {
  logger.error(`Schema for query '${query}' has not been found and the query has returned null`)
}

const stripDefaultDbFuncs = dbCtx => {
  return {
    ctx: dbCtx.ctx,
    query: dbCtx.$query,
    result: dbCtx.$result,
    many: dbCtx.$many,
    oneOrNone: dbCtx.$oneOrNone,
    one: dbCtx.$one,
    none: dbCtx.$none,
    any: dbCtx.$any,
    tx: dbCtx.$tx,
    task: dbCtx.$task
  }
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

const tx = (obj, opts, cb) => {
  return obj.tx(opts, t => {
    return cb(stripDefaultDbFuncs(t))
  })
}

const task = (obj, opts, cb) => {
  return obj.task(opts, t => {
    return cb(stripDefaultDbFuncs(t))
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
  query,
  tx,
  task,
  stripDefaultDbFuncs
}
