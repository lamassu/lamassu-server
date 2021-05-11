const db = require('../../db')
const uuid = require('uuid')
const getCustomInfoRequests = (onlyEnabled = false) => {
  const sql = onlyEnabled
    ? `SELECT * FROM custom_info_requests WHERE enabled = true ORDER BY custom_request->>'name'`
    : `SELECT * FROM custom_info_requests ORDER BY custom_request->>'name'`
  return db.any(sql)
}

const addCustomInfoRequest = (customRequest) => {
  const sql = 'INSERT INTO custom_info_requests (id, custom_request) VALUES ($1, $2)'
  const id = uuid.v4()
  return db.none(sql, [id, customRequest]).then(() => ({ id }))
}

const removeCustomInfoRequest = (id) => {
  return db.none('UPDATE custom_info_requests SET enabled = false WHERE id = $1', [id]).then(() => ({ id }))
}

const editCustomInfoRequest = (id, customRequest) => {
  return db.none('UPDATE custom_info_requests SET custom_request = $1 WHERE id=$2', [customRequest, id]).then(() => ({ id, customRequest }))
}

module.exports = {
  getCustomInfoRequests,
  addCustomInfoRequest,
  removeCustomInfoRequest,
  editCustomInfoRequest
}
