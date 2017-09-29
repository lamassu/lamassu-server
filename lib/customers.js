const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')
const BN = require('./bn')
const anonymous = require('../lib/constants').anonymousCustomer
const NUM_RESULTS = 20
const camelize = require('camelize')
const Pgp = require('pg-promise')()
const complianceOverrides = require('./compliance_overrides')
const users = require('./users')

function add (customer) {
  const sql = 'insert into customers (id, phone, phone_at) values ($1, $2, now()) returning *'
  return db.one(sql, [uuid.v4(), customer.phone])
}

function get (phone) {
  const sql = 'select id, phone from customers where phone=$1'
  return db.oneOrNone(sql, [phone])
  .then(customer => {
    if (!customer) return
    return getDailyVolume(customer.id).then(dailyVolume => {
      return _.set('dailyVolume', dailyVolume, customer)
    })
  })
}

/**
 * Update customer record
 *
 * @name update
 * @function
 *
 * @param {string} id Customer's id
 * @param {object} data Fields to update
 * @param {string} Acting user's token
 *
 * @returns {Promise} Newly updated Customer
 */
function update (id, data, userToken) {
  const formattedData = _.omit(['id'], _.mapKeys(_.snakeCase, data))
  const updateData = enhanceOverrideFields(formattedData, userToken)
  const sql = Pgp.helpers.update(updateData, _.keys(updateData), 'customers') +
    ' where id=$1 returning *'
  return db.one(sql, [id])
  .then(addComplianceOverrides(id, updateData, userToken))
  .then(populateOverrideUsernames)
  .then(format)
}

function getById (id, userToken) {
  const sql = 'select * from customers where id=$1'
  return db.oneOrNone(sql, [id])
  .then(populateOverrideUsernames)
  .then(format)
}

function getDailyVolume (id) {
  return Promise.all([
    db.one(`select coalesce(sum(fiat), 0) as total from cash_in_txs 
           where customer_id=$1 
           and created > now() - interval '1 day'`, [id]),
    db.one(`select coalesce(sum(fiat), 0) as total from cash_out_txs 
           where customer_id=$1 
           and created > now() - interval '1 day'`, [id])
  ]).then(([cashInTotal, cashOutTotal]) => {
    return BN(cashInTotal.total).add(cashOutTotal.total)
  })
}

/**
 * Get all available complianceTypes
 * that can be overriden (excluding hard_limit)
 *
 * @name getComplianceTypes
 * @function
 *
 * @returns {array} Array of compliance types' names
 */
function getComplianceTypes () {
  return [
    'sms',
    'id_card_data',
    'id_card_photo',
    'front_facing_cam',
    'sanctions_check',
    'authorized' ]
}

/**
 * Add *override_by and *override_at fields with acting user's token
 * and date of override respectively before saving to db.
 *
 * @name enhanceOverrideFields
 * @function
 *
 * @param {object} fields  Override fields to be enhanced
 * @param {string} userToken Acting user's token
 * @returns {object} fields enhanced with *_by and *_at fields
 */
function enhanceOverrideFields (fields, userToken) {
  if (!userToken) return fields
    // Populate with computedFields (user who overrode and overriden timestamps date)
  _.each(field => {
    if (fields[field + '_override']) {
      fields[field + '_override_by'] = userToken
      fields[field + '_override_at'] = new Date().toISOString()
    }
  }, getComplianceTypes())
  return fields
}

/**
 * Save new compliance override records
 *
 * Take the override fields that are modified in customer and create
 * a compliance override record in db for each compliance type.
 *
 * @name addComplianceOverrides
 * @function
 *
 * @param {string} id Customer's id
 * @param {object} customer Customer that is updating
 * @param {string} userToken Acting user's token
 *
 * @returns {promise} Result from compliance_overrides creation
 */
function addComplianceOverrides (id, customer, userToken) {
  // Prepare compliance overrides to save
  const overrides = _.map(field => {
    const complianceName = field + '_override'
    return (customer[complianceName]) ? {
      customerId: id,
      complianceType: field,
      overrideBy: userToken,
      verification: customer[complianceName]
    } : null
  }, getComplianceTypes())

  // Save all the updated  override fields
  return Promise.all(_.map(complianceOverrides.add, _.compact(overrides)))
}

/**
 * Format and populate fields
 * for customer record
 *
 * @name format
 * @function
 *
 * @param {object} Customer object
 * @returns {object} Customer camelized & populated with computed fields
 */
function format (customer) {
  if (!customer) return null
  /**
   * Populate with status field
   *
   */
  const status = _.maxBy('value', [{
    label: 'Phone',
    value: customer.phone_at
  }, {
    label: 'ID card',
    value: customer.id_card_at
  }, {
    label: 'Front facing camera',
    value: customer.front_facing_cam_at
  }, {
    label: 'ID card image',
    value: customer.id_card_image_at
  }])
  customer.status = status.label
  return camelize(customer)
}

/**
 * Populate the customer object with user names
 * only for those override fields that contain
 * *override_by values (user token references)
 *
 * @name populateOverrideUsernames
 * @function
 *
 * @param {object} customer Customer object to populate
 * @returns {promise} Customer with populated *by_name fields
 */
function populateOverrideUsernames (customer) {
  return Promise.all(_.map(field => {
    if (customer[field + '_override_by']) {
      return users.get(customer[field + '_override_by'])
      .then(user => {
        // just add the name to the customer object
        customer[field + '_override_by_name'] = user.name
        return null
      })
    } else return null
  }, getComplianceTypes()))
  .then(() => customer)
}

/**
 * Query all customers
 *
 * Add status as computed column,
 * which will indicate the name of the latest
 * compliance verfication completed by user.
 *
 * @returns {array} Array of customers populated with status field
 */
function batch () {
  const sql = `select * from customers 
  where id != $1
  order by created desc limit $2`
  return db.any(sql, [ anonymous.uuid, NUM_RESULTS ])
  .then(_.map(format))
}

module.exports = { add, get, batch, getById, update }
