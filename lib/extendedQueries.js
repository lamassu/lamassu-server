const { asyncLocalStorage } = require('./async-storage')

const getSchema = () => {
  const store = asyncLocalStorage.getStore()
  return store.get('schema')
}

const getDefaultSchema = () => {
  const store = asyncLocalStorage.getStore()
  return store.get('defaultSchema')
}

const any = (obj, query, variables) => {
  const schema = getSchema()
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
  return obj.taskEx({ schema }, t => {
    return t.result(query, variables, cb, thisArg).then(res => {
      return t.none('set search_path to $1~', [getDefaultSchema()]).then(() => {
        return res
      })
    })
  })
}

const query = (obj, query, variables, qrm) => {
  const schema = getSchema()
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
