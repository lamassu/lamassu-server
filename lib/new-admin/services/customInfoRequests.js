const db = require('../../db')
const uuid = require('uuid')
const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const getCustomInfoRequests = (onlyEnabled = false) => {
  const sql = onlyEnabled
    ? `SELECT * FROM custom_info_requests WHERE enabled = true ORDER BY custom_request->>'name'`
    : `SELECT * FROM custom_info_requests ORDER BY custom_request->>'name'`
  return db.any(sql).then(res => {
    return res.map(item => ({
      id: item.id,
      enabled: item.enabled,
      customRequest: item.custom_request
    }))
  })
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

const getAllCustomInfoRequestsForCustomer = (customerId) => {
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id = $1`
  return db.any(sql, [customerId]).then(res => res.map(item => ({
    customerId: item.customer_id,
    infoRequestId: item.info_request_id,
    approved: item.approved,
    customerData: item.customer_data
  })))
}

const getCustomInfoRequestForCustomer = (customerId, infoRequestId) => {
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id = $1 AND info_request_id = $2`
  return db.one(sql, [customerId, infoRequestId]).then(item => {
    return {
      customerId: item.customer_id,
      infoRequestId: item.info_request_id,
      approved: item.approved,
      customerData: item.customer_data
    }
  })
}

const batchGetAllCustomInfoRequestsForCustomer = (customerIds) => {
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id IN ($1^)`
  return db.any(sql, [_.map(pgp.as.text, customerIds).join(',')]).then(res => {
    const map = _.groupBy('customer_id', res)
    return customerIds.map(id => {
      const items = map[id] || []
      return items.map(item => ({
        customerId: item.customer_id,
        infoRequestId: item.info_request_id,
        approved: item.approved,
        customerData: item.customer_data
      }))
    })
  })
}

module.exports = {
  getCustomInfoRequests,
  addCustomInfoRequest,
  removeCustomInfoRequest,
  editCustomInfoRequest,
  getAllCustomInfoRequestsForCustomer,
  getCustomInfoRequestForCustomer,
  batchGetAllCustomInfoRequestsForCustomer
}
