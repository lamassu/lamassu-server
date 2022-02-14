const db = require('../../db')
const uuid = require('uuid')
const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const { loadLatestConfigOrNone, saveConfig } = require('../../../lib/new-settings-loader')

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
  return loadLatestConfigOrNone()
    .then(cfg => saveConfig({triggers: _.remove(x => x.customInfoRequestId === id, cfg.triggers ?? [])}))
    .then(() => db.none('UPDATE custom_info_requests SET enabled = false WHERE id = $1', [id]))
    .then(() => ({ id }));
}

const editCustomInfoRequest = (id, customRequest) => {
  return db.none('UPDATE custom_info_requests SET custom_request = $1 WHERE id=$2', [customRequest, id]).then(() => ({ id, customRequest }))
}

const getAllCustomInfoRequestsForCustomer = (customerId) => {
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id = $1`
  return db.any(sql, [customerId]).then(res => res.map(item => ({
    customerId: item.customer_id,
    infoRequestId: item.info_request_id,
    customerData: item.customer_data,
    override: item.override,
    overrideAt: item.override_at,
    overrideBy: item.override_by
  })))
}

const getCustomInfoRequestForCustomer = (customerId, infoRequestId) => {
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id = $1 AND info_request_id = $2`
  return db.one(sql, [customerId, infoRequestId]).then(item => {
    return {
      customerId: item.customer_id,
      infoRequestId: item.info_request_id,
      customerData: item.customer_data,
      override: item.override,
      overrideAt: item.override_at,
      overrideBy: item.override_by
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
        customerData: item.customer_data,
        override: item.override,
        overrideAt: item.override_at,
        overrideBy: item.override_by
      }))
    })
  })
}

const getCustomInfoRequest = (infoRequestId) => {
  const sql = `SELECT * FROM custom_info_requests WHERE id = $1`
  return db.one(sql, [infoRequestId]).then(item => ({
    id: item.id,
    enabled: item.enabled,
    customRequest: item.custom_request
  }))
}

const batchGetCustomInfoRequest = (infoRequestIds) => {
  if (infoRequestIds.length === 0) return Promise.resolve([])
  const sql = `SELECT * FROM custom_info_requests WHERE id IN ($1^)`
  return db.any(sql, [_.map(pgp.as.text, infoRequestIds).join(',')]).then(res => {
    const map = _.groupBy('id', res)
    return infoRequestIds.map(id => {
      const item = map[id][0] // since id is primary key the array always has 1 element
      return {
        id: item.id,
        enabled: item.enabled,
        customRequest: item.custom_request
      }
    })
  })
}

const setAuthorizedCustomRequest = (customerId, infoRequestId, override, token) => {
  const sql = `UPDATE customers_custom_info_requests SET override = $1, override_by = $2, override_at = now() WHERE customer_id = $3 AND info_request_id = $4`
  return db.none(sql, [override, token, customerId, infoRequestId]).then(() => true)
}

const setCustomerData = (customerId, infoRequestId, data) => {
  const sql = `
  INSERT INTO customers_custom_info_requests (customer_id, info_request_id, customer_data)
    VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, info_request_id)
      DO UPDATE SET customer_data = $3`
  return db.none(sql, [customerId, infoRequestId, data])
}

const setCustomerDataViaMachine = (customerId, infoRequestId, data) => {
  const sql = `
  INSERT INTO customers_custom_info_requests (customer_id, info_request_id, customer_data)
    VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, info_request_id)
      DO UPDATE SET customer_data = $3, override = $4, override_by = $5, override_at = now()`
  return db.none(sql, [customerId, infoRequestId, data, 'automatic', null])
}

module.exports = {
  getCustomInfoRequests,
  addCustomInfoRequest,
  removeCustomInfoRequest,
  editCustomInfoRequest,
  getAllCustomInfoRequestsForCustomer,
  getCustomInfoRequestForCustomer,
  batchGetAllCustomInfoRequestsForCustomer,
  getCustomInfoRequest,
  batchGetCustomInfoRequest,
  setAuthorizedCustomRequest,
  setCustomerData,
  setCustomerDataViaMachine
}
