const db = require('../../db')

const getCustomInfoRequests = () => {
  const sql = 'SELECT * FROM custom_info_requests'
  return db.any(sql)
}

module.exports = {
  getCustomInfoRequests
}
