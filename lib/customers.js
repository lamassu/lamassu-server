const uuid = require('uuid')
const Pgp = require('pg-promise')()
const _ = require('lodash/fp')

const db = require('./db')
const BN = require('./bn')
const anonymous = require('../lib/constants').anonymousCustomer
const camelize = _.mapKeys(_.camelCase)
const complianceOverrides = require('./compliance_overrides')
const users = require('./users')

const NUM_RESULTS = 20

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
  .then(computeStatus)
  .then(camelize)
}

function getById (id, userToken) {
  const sql = 'select * from customers where id=$1'
  return db.oneOrNone(sql, [id])
  .then(populateOverrideUsernames)
  .then(computeStatus)
  .then(camelize)
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
  return _.reduce(_.assign, fields, _.map((type) => {
    return (fields[type + '_override'])
      ? {
        [type + '_override_by']: userToken,
        [type + '_override_at']: 'now()^'
      }
      : {}
  }, getComplianceTypes()))
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
  .then(() => customer)
}

/**
 * Compute status field
 *
 * Status field indicates the last
 * compliance user has verified
 *
 * @name computeStatus
 * @function
 *
 * @param {object} Customer object
 * @returns {object} Customer populated with status field
 */
function computeStatus (customer) {
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

  return _.assign(customer, {
    status: status.label
  })
}

/**
 * Populate the customer object with user names
 * for override fields ( fields ending with _override_by )
 *
 * @name populateOverrideUsernames
 * @function
 *
 * @param {object} customer Customer object to populate
 * @returns {promise} Customer with populated *by_name fields
 */
function populateOverrideUsernames (customer) {
  const fieldsToUpdate = _.map(field => {
    return {
      token: customer[field + '_override_by'],
      field: field + '_override_by_name'
    }
  }, getComplianceTypes())
  const queryTokens = _.map('token', fieldsToUpdate)

  return users.getByIds(queryTokens)
  .then(usersList => {
    return _.map(userField => {
      const user = _.find({token: userField.token}, usersList)
      return {
        [userField.field]: user ? user.name : null
      }
    }, fieldsToUpdate)
  })
  .then(_.reduce(_.assign, customer))
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
  .then(customers => Promise.all(_.map(customer => {
    return populateOverrideUsernames(customer)
    .then(computeStatus)
    .then(camelize)
  }, customers)))
}

module.exports = { add, get, batch, getById, update }
