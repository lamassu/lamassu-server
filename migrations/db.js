const db = require('../lib/db')
const sequential = require('promise-sequential')

module.exports = {multi}

function multi (sqls, cb) {
  return sequential(sqls.map(s => db.none(s)))
  .then(cb)
  .catch(cb)
}
