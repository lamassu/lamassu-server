const db = require('../lib/db')
const sequential = require('promise-sequential')

module.exports = {multi}

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
