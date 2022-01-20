const uuid = require('uuid')
const Pgp = require('pg-promise')()
const _ = require('lodash/fp')
const crypto = require('crypto')
const makeDir = require('make-dir')
const path = require('path')
const fs = require('fs')
const util = require('util')
const { sub, differenceInHours } = require('date-fns/fp')

const db = require('./db')
const BN = require('./bn')
const anonymous = require('../lib/constants').anonymousCustomer
const complianceOverrides = require('./compliance_overrides')
const users = require('./users')
const options = require('./options')
const writeFile = util.promisify(fs.writeFile)
const notifierQueries = require('./notifier/queries')
const notifierUtils = require('./notifier/utils')
const NUM_RESULTS = 1000
const idPhotoCardBasedir = _.get('idPhotoCardDir', options)
const frontCameraBaseDir = _.get('frontCameraDir', options)
const operatorDataDir = _.get('operatorDataDir', options)
const sms = require('./sms')
const settingsLoader = require('./new-settings-loader')
const logger = require('./logger')

const TX_PASSTHROUGH_ERROR_CODES = ['operatorCancel']

/**
 * Add new customer
 *
 * @name add
 * @function
 *
 * @param {object} Customer object (with phone number)
 *
 * @returns {object} Newly created customer
 */
function add (customer) {
  const sql = 'insert into customers (id, phone, phone_at) values ($1, $2, now()) returning *'
  return db.one(sql, [uuid.v4(), customer.phone])
    .then(populateOverrideUsernames)
    .then(computeStatus)
    .then(populateDailyVolume)
    .then(getCustomInfoRequestsData)
    .then(camelize)
}

/**
 * Get single customer by phone
 * Phone numbers are unique per customer
 *
 * @name get
 * @function
 *
 * @param {string} phone Customer's phone number
 *
 * @returns {object} Customer
 */
function get (phone) {
  const sql = 'select * from customers where phone=$1'
  return db.oneOrNone(sql, [phone])
    .then(populateDailyVolume)
    .then(getCustomInfoRequestsData)
    .then(camelize)
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
function update (id, data, userToken, txId) {
  const formattedData = _.omit(['id'], _.mapKeys(_.snakeCase, data))

  const enhancedUpdateData = enhanceAtFields(enhanceOverrideFields(formattedData, userToken))
  const updateData = updateOverride(enhancedUpdateData)

  const sql = Pgp.helpers.update(updateData, _.keys(updateData), 'customers') +
    ' where id=$1 returning *'

  return db.one(sql, [id])
    .then(customerData => {
       return getEditedData(id)
         .then(customerEditedData => selectLatestData(customerData, customerEditedData))
     })
    .then(addComplianceOverrides(id, updateData, userToken))
    .then(populateOverrideUsernames)
    .then(computeStatus)
    .then((it) => populateDailyVolume(it, txId))
    .then(getCustomInfoRequestsData)
    .then(camelize)
}

/**
 * Update customer record
 *
 * @name updateCustomer
 * @function
 *
 * @param {string} id Customer's id
 * @param {object} data Fields to update
 *
 * @returns {Promise} Newly updated Customer
 */
async function updateCustomer (id, data, userToken) {
  const formattedData = _.pick(
    [
      'authorized_override',
      'id_card_photo_override',
      'id_card_data_override',
      'sms_override',
      'us_ssn_override',
      'sanctions_override',
      'front_camera_override',
      'suspended_until',
      'phone_override'
    ],
    _.mapKeys(_.snakeCase, data))

  const enhancedUpdateData = enhanceAtFields(enhanceOverrideFields(formattedData, userToken))
  const updateData = updateOverride(enhancedUpdateData)
  
  if (!_.isEmpty(updateData)) {
    const sql = Pgp.helpers.update(updateData, _.keys(updateData), 'customers') +
    ' where id=$1'

    await db.none(sql, [id])
  }

  if (data.subscriberInfo) {
    Promise.all([getCustomerById(id), settingsLoader.loadLatest()])
      .then(([customer, config]) => sms.getLookup(config, customer.phone))
      .then(res => updateSubscriberData(id, res, userToken))
      .catch(logger.error)
  }
  invalidateCustomerNotifications(id, formattedData)
  return getCustomerById(id)
}

/**
 * Update all customer record
 *
 * @name save
 * @function
 *
 * @param {string} id Customer's id
 * @param {object} data Fields to update
 *
 * @returns {Promise} Newly updated Customer
 */

function edit (id, data, userToken) {
  const defaults = [
    'front_camera',
    'id_card_data',
    'id_card_photo',
    'us_ssn',
    'subscriber_info',
    'name',
    'phone'
  ]
  const filteredData = _.pick(defaults, _.mapKeys(_.snakeCase, _.omitBy(_.isNil, data)))
  if (_.isEmpty(filteredData)) return getCustomerById(id)
  const formattedData = enhanceEditedPhotos(enhanceEditedFields(filteredData, userToken))

  const defaultDbData = {
    customer_id: id,
    created: new Date(),
    ...formattedData
  }

  const cs = new Pgp.helpers.ColumnSet(_.keys(defaultDbData),
    { table: 'edited_customer_data' })
  const onConflict = ' ON CONFLICT (customer_id) DO UPDATE SET ' +
    cs.assignColumns({ from: 'EXCLUDED', skip: ['customer_id', 'created'] })
  const upsert = Pgp.helpers.insert(defaultDbData, cs) + onConflict
  return db.none(upsert)
    .then(getCustomerById(id))
}

/**
 * Add *edited_by and *edited_at fields with acting user's token
 * and date of override respectively before saving to db.
 *
 * @name enhanceEditedFields
 * @function
 *
 * @param {object} fields Fields to be enhanced
 * @param {string} userToken Acting user's token
 * @returns {object} fields enhanced with *_by and *_at fields
 */

function enhanceEditedFields (fields, userToken) {
  if (!userToken) return fields
  _.mapKeys((field) => {
    fields[field + '_by'] = userToken
    fields[field + '_at'] = 'now()^'
  }, fields)
  return fields
}

/**
 * Add *_path to edited photos fields
 *
 * @name enhanceEditedFields
 * @function
 *
 * @param {object} fields Fields to be enhanced
 * @returns {object} fields enhanced with *_path
 */

function enhanceEditedPhotos (fields) {
  return _.mapKeys((field) => {
    if (_.includes(field, ['front_camera', 'id_card_photo'])) {
      return field + '_path'
    }
    return field
  }, fields)
}

/**
 * Remove the edited data from the db record
 *
 * @name enhanceOverrideFields
 * @function
 *
 * @param {string} id Customer's id
 * @param {object} data Fields to be deleted
 *
 * @returns {Promise} Newly updated Customer
 *
 */

function deleteEditedData (id, data) {
  // TODO: NOT IMPLEMENTING THIS FEATURE FOR THE CURRENT VERSION
  const defaults = [
    'front_camera',
    'id_card_data',
    'id_card_photo',
    'us_ssn',
    'subcriber_info',
    'name'
  ]
  const filteredData = _.pick(defaults, _.mapKeys(_.snakeCase, data))
  if (_.isEmpty(filteredData)) return getCustomerById(id)

  const cs = new Pgp.helpers.ColumnSet(_.keys(filteredData),
    { table: 'edited_customer_data' })
  const update = Pgp.helpers.update(filteredData, cs)
  db.none(update)
  return getCustomerById(id)
}

/**
 * Replace customer's compliance photos
 *
 * @name save
 * @function
 *
 * @param {string} id Customer's id
 * @param {File} photo New photo data
 * @param {string} photoType Photo's compliance type
 *
 * @returns {object} path New photo path
 *
 */
async function updateEditedPhoto (id, photo, photoType) {
  const newPatch = {}
  const baseDir = photoType === 'frontCamera' ? frontCameraBaseDir : idPhotoCardBasedir
  const { createReadStream, filename } = photo
  const stream = createReadStream()

  const randomString = uuid.v4().toString() + '/'

  // i.e. ..62ed29c5-f37e-4fb7-95bb-c52d4a3738f7/filename.jpg
  const rpath = path.join(randomString, filename)

  // create the directory tree if needed
  _.attempt(() => makeDir.sync(path.join(baseDir, randomString)))

  // i.e. ../<lamassu-server-home>/idphotocard/62ed29c5-f37e-4fb7-95bb-c52d4a3738f7/filename.jpg
  const pathName = path.join(baseDir, rpath)

  await stream.pipe(fs.createWriteStream(pathName))
  newPatch[photoType] = rpath

  return newPatch
}

const invalidateCustomerNotifications = (id, data) => {
  if (data.authorized_override !== 'verified') return Promise.resolve()

  const detailB = notifierUtils.buildDetail({ code: 'BLOCKED', customerId: id })
  return notifierQueries.invalidateNotification(detailB, 'compliance')
}

const updateSubscriberData = (customerId, data, userToken) => {
  const sql = `UPDATE customers SET subscriber_info=$1, subscriber_info_at=now(), subscriber_info_by=$2 WHERE id=$3`
  return db.none(sql, [data, userToken, customerId])
}

/**
 * Get customer by id
 *
 * @name getById
 * @function
 *
 * @param {string} id Customer's unique id
 * @param {string} userToken Acting user's token
 *
 * @returns {object} Customer found
 */
function getById (id, userToken) {
  const sql = 'select * from customers where id=$1'
  return db.oneOrNone(sql, [id])
    .then(populateOverrideUsernames)
    .then(computeStatus)
    .then(populateDailyVolume)
    .then(getCustomInfoRequestsData)
    .then(camelize)
}

/**
 * Get and calculate customer's daily volume
 * for both cash_in & cash_out txs
 *
 * @name getDailyVolume
 * @function
 *
 * @param {string} id Customer's id
 * @param {string} txId current tx, to be ignored in the query
 * @returns {Bignumber} Customer's daily volume
 */
function getDailyVolume (id, txId) {
  const queries = txId ? getDailyVolumeMinusCurrentTxQueries(id, txId) : getDailyVolumeQueries(id)
  return Promise.all(queries).then(([cashIn, cashOut]) => {
    const dailyVolume = new BN(cashIn.total).plus(cashOut.total)
    const hoursTillLimitClear = getHoursTillLimitClear(cashIn.maxdate, cashOut.maxdate)
    return { dailyVolume, hoursTillLimitClear }
  })
}

function getDailyVolumeQueries (id) {
  return [
    db.one(`select coalesce(sum(fiat), 0) as total, max(created) as maxdate from cash_in_txs
          where customer_id=$1
          and created > now() - interval '1 day'`, [id]),
    db.one(`select coalesce(sum(fiat), 0) as total, max(created) as maxdate from cash_out_txs
          where customer_id=$1
          and created > now() - interval '1 day'`, [id])
  ]
}

function getDailyVolumeMinusCurrentTxQueries (id, txId) {
  return [
    db.one(`select coalesce(sum(fiat), 0) as total, max(created) as maxdate from cash_in_txs
          where customer_id=$1
          and id!=$2
          and created > now() - interval '1 day'`, [id, txId]),
    db.one(`select coalesce(sum(fiat), 0) as total, max(created) as maxdate from cash_out_txs
          where customer_id=$1
          and id!=$2
          and created > now() - interval '1 day'`, [id, txId])
  ]
}

function getHoursTillLimitClear (cashInDate, cashOutDate) {
  let startDate = new Date()
  startDate = sub({ days: 1 }, startDate)

  const cashInMoment = new Date(cashInDate || startDate)
  const cashOutMoment = new Date(cashOutDate || startDate)

  const cashInDuration = differenceInHours(cashInMoment, startDate)
  const cashOutDuration = differenceInHours(cashOutMoment, startDate)

  return _.ceil(_.max([cashInDuration, cashOutDuration, 0]))
}

/**
 * Camelize customer fields
 * Note: return null if customer is undefined
 *
 * @name camelize
 * @function
 *
 * @param {object} customer Customer with snake_case fields
 * @returns {object} Camelized Customer object
 */
function camelize (customer) {
  return customer ? _.mapKeys(_.camelCase, customer) : null
}

/**
 * Populate customer object
 * with dailyVolume information
 *
 * @name populateDailyVolume
 * @function
 *
 * @param {object} customer Customer object
 * @returns {object} Customer object populated with dailyVolume
 */
function populateDailyVolume (customer, txId) {
  if (!customer) return
  return getDailyVolume(customer.id, txId).then(({ dailyVolume, hoursTillLimitClear }) => {
    let withHours = _.set('hours_till_limit_clear', hoursTillLimitClear, customer)
    return _.set('daily_volume', dailyVolume, withHours)
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
    'front_camera',
    'sanctions',
    'authorized',
    'us_ssn' ]
}

function updateOverride (fields) {
  const updateableFields = [
    'id_card_data',
    'id_card_photo_path',
    'front_camera_path',
    'authorized',
    'us_ssn'
  ]

  const removePathSuffix = _.map(_.replace('_path', ''))
  const getPairs = _.map(f => [`${f}_override`, 'automatic'])

  const updatedFields = _.intersection(updateableFields, _.keys(fields))
  const overrideFields = _.compose(_.fromPairs, getPairs, removePathSuffix)(updatedFields)

  return _.merge(fields, overrideFields)
}

function enhanceAtFields (fields) {
  const updateableFields = [
    'id_card_data',
    'id_card_photo',
    'front_camera',
    'sanctions',
    'authorized',
    'us_ssn'
  ]

  const updatedFields = _.intersection(updateableFields, _.keys(fields))
  const atFields = _.fromPairs(_.map(f => [`${f}_at`, 'now()^'], updatedFields))

  return _.merge(fields, atFields)
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
    label: 'Sanctions',
    value: customer.sanctions_at
  }, {
    label: 'Front camera',
    value: customer.front_camera_at
  }, {
    label: 'ID card image',
    value: customer.id_card_image_at
  }])

  return _.assign(customer, {
    status: _.get('label', status)
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
      token: customer[field + '_override_by'] || customer[field + '_override_by_old'],
      field: field + '_override_by_name'
    }
  }, getComplianceTypes())
  const queryTokens = _.map('token', fieldsToUpdate)

  return users.getByIds(queryTokens)
    .then(usersList => {
      return _.map(userField => {
        const user = _.find({ token: userField.token }, usersList)
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
        .then(populateDailyVolume)
        .then(getCustomInfoRequestsData)
        .then(camelize)
    }, customers)))
}

// TODO: getCustomersList and getCustomerById are very similar, so this should be refactored

/**
 * Query all customers, ordered by last activity
 * and with aggregate columns based on their
 * transactions
 *
 * @returns {array} Array of customers with it's transactions aggregations
 */

function getCustomersList (phone = null, name = null, address = null, id = null) {
  const passableErrorCodes = _.map(Pgp.as.text, TX_PASSTHROUGH_ERROR_CODES).join(',')

  const sql = `SELECT id, authorized_override, days_suspended, is_suspended, front_camera_path, front_camera_override,
  phone, sms_override, id_card_data, id_card_data_override, id_card_data_expiration,
  id_card_photo_path, id_card_photo_override, us_ssn, us_ssn_override, sanctions, sanctions_at,
  sanctions_override, total_txs, total_spent, LEAST(created, last_transaction) AS last_active, fiat AS last_tx_fiat,
  fiat_code AS last_tx_fiat_code, tx_class AS last_tx_class, custom_fields, notes, is_test_customer
  FROM (
    SELECT c.id, c.authorized_override,
    greatest(0, date_part('day', c.suspended_until - NOW())) AS days_suspended,
    c.suspended_until > NOW() AS is_suspended,
    c.front_camera_path, c.front_camera_override,
    c.phone, c.sms_override, c.id_card_data, c.id_card_data_override, c.id_card_data_expiration,
    c.id_card_photo_path, c.id_card_photo_override, c.us_ssn, c.us_ssn_override, c.sanctions,
    c.sanctions_at, c.sanctions_override, c.is_test_customer, c.created, t.tx_class, t.fiat, t.fiat_code, t.created as last_transaction, cn.notes,
    row_number() OVER (partition by c.id order by t.created desc) AS rn,
    sum(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) OVER (partition by c.id) AS total_txs,
    coalesce(sum(CASE WHEN error_code IS NULL OR error_code NOT IN ($1^) THEN t.fiat ELSE 0 END) OVER (partition by c.id), 0) AS total_spent, ccf.custom_fields
    FROM customers c LEFT OUTER JOIN (
      SELECT 'cashIn' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_in_txs WHERE send_confirmed = true OR batched = true UNION
      SELECT 'cashOut' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_out_txs WHERE confirmed_at IS NOT NULL) AS t ON c.id = t.customer_id
      LEFT OUTER JOIN (
        SELECT cf.customer_id, json_agg(json_build_object('id', cf.custom_field_id, 'label', cf.label, 'value', cf.value)) AS custom_fields FROM (
          SELECT ccfp.custom_field_id, ccfp.customer_id, cfd.label, ccfp.value FROM custom_field_definitions cfd
          LEFT OUTER JOIN customer_custom_field_pairs ccfp ON cfd.id = ccfp.custom_field_id
        ) cf GROUP BY cf.customer_id
      ) ccf ON c.id = ccf.customer_id
      LEFT OUTER JOIN (
        SELECT customer_id, coalesce(json_agg(customer_notes.*), '[]'::json) AS notes FROM customer_notes
        GROUP BY customer_notes.customer_id
      ) cn ON c.id = cn.customer_id
    WHERE c.id != $2
  ) AS cl WHERE rn = 1
  AND ($4 IS NULL OR phone = $4)
  AND ($5 IS NULL OR  CONCAT(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') = $5 OR id_card_data::json->>'firstName' = $5 OR id_card_data::json->>'lastName' = $5)
  AND ($6 IS NULL OR  id_card_data::json->>'address' = $6)
  AND ($7 IS NULL OR  id_card_data::json->>'documentNumber' = $7)
  limit $3`
  return db.any(sql, [ passableErrorCodes, anonymous.uuid, NUM_RESULTS, phone, name, address, id ])
    .then(customers => Promise.all(_.map(customer => {
      return populateOverrideUsernames(customer)
        .then(camelize)
        .then(it => ({ ...it, notes: (it.notes ?? []).map(camelize) }))
    }, customers)))
}

/**
 * Query a specific customer, ordered by last activity
 * and with aggregate columns based on their
 * transactions
 *
 * @returns {array} A single customer instance with non edited
 */
function getCustomerById (id) {
  const passableErrorCodes = _.map(Pgp.as.text, TX_PASSTHROUGH_ERROR_CODES).join(',')
  const sql = `SELECT id, authorized_override, days_suspended, is_suspended, front_camera_path, front_camera_at, front_camera_override,
  phone, phone_at, sms_override, id_card_data_at, id_card_data, id_card_data_override, id_card_data_expiration,
  id_card_photo_path, id_card_photo_at, id_card_photo_override, us_ssn_at, us_ssn, us_ssn_override, sanctions, sanctions_at,
  sanctions_override, total_txs, total_spent, LEAST(created, last_transaction) AS last_active, fiat AS last_tx_fiat,
  fiat_code AS last_tx_fiat_code, tx_class AS last_tx_class, subscriber_info, subscriber_info_at, phone_override, custom_fields, notes, is_test_customer
  FROM (
    SELECT c.id, c.authorized_override,
    greatest(0, date_part('day', c.suspended_until - now())) AS days_suspended,
    c.suspended_until > now() AS is_suspended,
    c.front_camera_path, c.front_camera_override, c.front_camera_at,
    c.phone, c.phone_at, c.sms_override, c.id_card_data, c.id_card_data_at, c.id_card_data_override, c.id_card_data_expiration,
    c.id_card_photo_path, c.id_card_photo_at, c.id_card_photo_override, c.us_ssn, c.us_ssn_at, c.us_ssn_override, c.sanctions,
    c.sanctions_at, c.sanctions_override, c.subscriber_info, c.is_test_customer, c.created, t.tx_class, t.fiat, t.fiat_code, t.created as last_transaction, cn.notes,
    row_number() OVER (PARTITION BY c.id ORDER BY t.created DESC) AS rn,
    sum(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) OVER (PARTITION BY c.id) AS total_txs,
    sum(CASE WHEN error_code IS NULL OR error_code NOT IN ($1^) THEN t.fiat ELSE 0 END) OVER (PARTITION BY c.id) AS total_spent, ccf.custom_fields
    FROM customers c LEFT OUTER JOIN (
      SELECT 'cashIn' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_in_txs WHERE send_confirmed = true OR batched = true UNION
      SELECT 'cashOut' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_out_txs WHERE confirmed_at IS NOT NULL) t ON c.id = t.customer_id
      LEFT OUTER JOIN (
        SELECT cf.customer_id, json_agg(json_build_object('id', cf.custom_field_id, 'label', cf.label, 'value', cf.value)) AS custom_fields FROM (
          SELECT ccfp.custom_field_id, ccfp.customer_id, cfd.label, ccfp.value FROM custom_field_definitions cfd
          LEFT OUTER JOIN customer_custom_field_pairs ccfp ON cfd.id = ccfp.custom_field_id
        ) cf GROUP BY cf.customer_id
      ) ccf ON c.id = ccf.customer_id
      LEFT OUTER JOIN (
        SELECT customer_id, coalesce(json_agg(customer_notes.*), '[]'::json) AS notes FROM customer_notes
        GROUP BY customer_notes.customer_id
      ) cn ON c.id = cn.customer_id
    WHERE c.id = $2
  ) AS cl WHERE rn = 1`
  return db.oneOrNone(sql, [passableErrorCodes, id])
    .then(customerData => {
      return getEditedData(id)
        .then(customerEditedData => selectLatestData(customerData, customerEditedData))
    })
    .then(populateOverrideUsernames)
    .then(camelize)
    .then(it => ({ ...it, notes: (it.notes ?? []).map(camelize) }))
}

/**
 * Query the specific customer manually edited data
 *
 * @param {String} id customer id
 *
 * @returns {array} A single customer instance with the most recent edited data
 */
function getEditedData (id) {
  const sql = `SELECT * FROM edited_customer_data WHERE customer_id = $1`
  return db.oneOrNone(sql, [id])
    .then(_.omitBy(_.isNil))
}

function selectLatestData (customerData, customerEditedData) {
  const defaults = [
    'front_camera',
    'id_card_data',
    'id_card_photo',
    'us_ssn',
    'subscriber_info',
    'name',
    'phone'
  ]
  _.map(field => {
    let fieldName = field
    if (_.includes(field, ['front_camera', 'id_card_photo'])) fieldName = fieldName + '_path'
    const atField = field + '_at'
    const byField = field + '_by'
    if (!_.has(fieldName, customerData) || !_.has(fieldName, customerEditedData)) return
    if (customerData[atField] < customerEditedData[atField]) {
      customerData[fieldName] = customerEditedData[fieldName]
      customerData[atField] = customerEditedData[atField]
      customerData[byField] = customerEditedData[byField]
    }
  }
  , defaults)
  return customerData
}

/**
 * @param {String} id customer id
 * @param {Object} patch customer update record
 * @returns {Promise<Object>} new patch to be applied
 */
function updatePhotoCard (id, patch) {
  return Promise.resolve(patch)
    .then(patch => {
      // Base64 encoded image /9j/4AAQSkZJRgABAQAAAQ..
      const imageData = _.get('idCardPhotoData', patch)

      if (_.isEmpty(imageData)) {
        return patch
      }

      // remove idCardPhotoData from the update record
      const newPatch = _.omit('idCardPhotoData', patch)

      // decode the base64 string to binary data
      const decodedImageData = Buffer.from(imageData, 'base64')

      // workout the image hash
      // i.e. 240e85ff2e4bb931f235985dd0134e459239496d2b5af6c5665168d38ef89b50
      const hash = crypto
        .createHash('sha256')
        .update(imageData)
        .digest('hex')

      // workout the image folder
      // i.e. 24/0e/85
      const rpath = _.join(path.sep, _.map(_.wrap(_.join, ''), _.take(3, _.chunk(2, _.split('', hash)))))

      // i.e. ../<lamassu-server-home>/idphotocard/24/0e/85
      const dirname = path.join(idPhotoCardBasedir, rpath)

      // create the directory tree if needed
      _.attempt(() => makeDir.sync(dirname))

      // i.e. ../<lamassu-server-home>/idphotocard/24/0e/85/240e85ff2e4bb931f235985dd01....jpg
      const filename = path.join(dirname, hash + '.jpg')

      // update db record patch
      // i.e. {
      //   "idCardPhotoPath": "24/0e/85/240e85ff2e4bb931f235985dd01....jpg",
      //   "idCardPhotoAt": "now()"
      // }
      newPatch.idCardPhotoPath = path.join(rpath, hash + '.jpg')
      newPatch.idCardPhotoAt = 'now()'

      // write image file
      return writeFile(filename, decodedImageData)
        .then(() => newPatch)
    })
}

/**
 * @param {String} imageData image encoded
 * @param {String} directory directory path of id card data for a certain user
 */

function updatePhotos (imagesData, id, dir) {
  return Promise.resolve(imagesData)
    .then(patch => {
      if (_.isEmpty(imagesData)) {
        return patch
      }
      const newPatch = {}
      // i.e. ../<lamassu-server-home>/<operatorid>/<customerid>/idcarddata
      const dirname = path.join(dir)
      // create the directory tree if needed
      _.attempt(() => makeDir.sync(dirname))
      const promises = imagesData.map((imageData, index) => {
        // decode the base64 string to binary data
        const decodedImageData = Buffer.from(imageData, 'base64')
        // i.e. ../<lamassu-server-home>/<operatorid>/<customerid>/idcarddata/1.jpg
        const filename = path.join(dirname, index + '.jpg')
        return writeFile(filename, decodedImageData)
      })

      return Promise.all(promises)
        .then(arr => {
          newPatch.idCardData = path.join(dirname)
          newPatch.idCardDataAt = 'now()'
          return newPatch
        })
    })
}

/**
 * @param {String} id customer id
 * @param {Object} patch customer latest id card photos
 * @returns {Promise<Object>} new patch to be applied
 */
function updateIdCardData (patch, id) {
  /* TODO: fetch operator id */
  const operatorId = 'id-operator'
  const directory = `${operatorDataDir}/${operatorId}/${id}/`

  return Promise.resolve(patch)
    .then(patch => {
      const imagesData = _.get('photos', patch)
      return updatePhotos(imagesData, id, directory)
        .then(newPatch => newPatch)
        .catch(err => logger.error('while saving the image: ', err))
    })
}

/**
 * @param {String} imageData customer t&c photo data
 * @returns {Promise<Object>} new patch to be applied
 */
function updateTxCustomerPhoto (imageData) {
  return Promise.resolve(imageData)
    .then(imageData => {
      const newPatch = {}
      const directory = `${operatorDataDir}/customersphotos`

      if (_.isEmpty(imageData)) {
        return
      }

      // decode the base64 string to binary data
      const decodedImageData = Buffer.from(imageData, 'base64')

      // workout the image hash
      // i.e. 240e85ff2e4bb931f235985dd0134e459239496d2b5af6c5665168d38ef89b50
      const hash = crypto
        .createHash('sha256')
        .update(imageData)
        .digest('hex')

      // workout the image folder
      // i.e. 24/0e/85
      const rpath = _.join(path.sep, _.map(_.wrap(_.join, ''), _.take(3, _.chunk(2, _.split('', hash)))))

      // i.e. ../<lamassu-server-home>/<operator-dir>/customersphotos/24/0e/85
      const dirname = path.join(directory, rpath)

      // create the directory tree if needed
      _.attempt(() => makeDir.sync(dirname))

      // i.e. ../<lamassu-server-home>/<operator-dir>/customersphotos/24/0e/85/240e85ff2e4bb931f235985dd01....jpg
      const filename = path.join(dirname, hash + '.jpg')

      // update db record patch
      // i.e. {
      //   "idCustomerTxPhoto": "24/0e/85/240e85ff2e4bb931f235985dd01....jpg",
      //   "idCustomerTxPhotoAt": "now()"
      // }
      newPatch.txCustomerPhotoPath = path.join(rpath, hash + '.jpg')
      newPatch.txCustomerPhotoAt = 'now()'

      // write image file
      return writeFile(filename, decodedImageData)
        .then(() => newPatch)
    })
}

function updateFrontCamera (id, patch) {
  return Promise.resolve(patch)
    .then(patch => {
      // Base64 encoded image /9j/4AAQSkZJRgABAQAAAQ..
      const imageData = _.get('frontCameraData', patch)

      if (_.isEmpty(imageData)) {
        return patch
      }

      // remove idCardPhotoData from the update record
      const newPatch = _.omit('frontCameraData', patch)

      // decode the base64 string to binary data
      const decodedImageData = Buffer.from(imageData, 'base64')

      // workout the image hash
      // i.e. 240e85ff2e4bb931f235985dd0134e459239496d2b5af6c5665168d38ef89b50
      const hash = crypto
        .createHash('sha256')
        .update(imageData)
        .digest('hex')

      // workout the image folder
      // i.e. 24/0e/85
      const rpath = _.join(path.sep, _.map(_.wrap(_.join, ''), _.take(3, _.chunk(2, _.split('', hash)))))

      // i.e. ../<lamassu-server-home>/idphotocard/24/0e/85
      const dirname = path.join(frontCameraBaseDir, rpath)

      // create the directory tree if needed
      _.attempt(() => makeDir.sync(dirname))

      // i.e. ../<lamassu-server-home>/idphotocard/24/0e/85/240e85ff2e4bb931f235985dd01....jpg
      const filename = path.join(dirname, hash + '.jpg')

      // update db record patch
      // i.e. {
      //   "idCardPhotoPath": "24/0e/85/240e85ff2e4bb931f235985dd01....jpg",
      //   "idCardPhotoAt": "now()"
      // }
      newPatch.frontCameraPath = path.join(rpath, hash + '.jpg')
      newPatch.frontCameraAt = 'now()'

      // write image file
      return writeFile(filename, decodedImageData)
        .then(() => newPatch)
    })
}

function addCustomField (customerId, label, value) {
  const sql = `SELECT * FROM custom_field_definitions WHERE label=$1 LIMIT 1`
  return db.oneOrNone(sql, [label])
    .then(res => db.tx(t => {
      if (_.isNil(res)) {
        const fieldId = uuid.v4()
        const q1 = t.none(`INSERT INTO custom_field_definitions (id, label) VALUES ($1, $2)`, [fieldId, label])
        const q2 = t.none(`INSERT INTO customer_custom_field_pairs (customer_id, custom_field_id, value) VALUES ($1, $2, $3)`, [customerId, fieldId, value])
        return t.batch([q1, q2])
      }

      if (!_.isNil(res) && !res.active) {
        const q1 = t.none(`UPDATE custom_field_definitions SET active = true WHERE id=$1`, [res.id])
        const q2 = t.none(`INSERT INTO customer_custom_field_pairs (customer_id, custom_field_id, value) VALUES ($1, $2, $3)`, [customerId, res.id, value])
        return t.batch([q1, q2])
      } else if (!_.isNil(res) && res.active) {
        const q1 = t.none(`INSERT INTO customer_custom_field_pairs (customer_id, custom_field_id, value) VALUES ($1, $2, $3)`, [customerId, res.id, value])
        return t.batch([q1])
      }
    })
    )
    .then(res => !_.isNil(res))
}

function saveCustomField (customerId, fieldId, newValue) {
  const sql = `UPDATE customer_custom_field_pairs SET value=$1 WHERE customer_id=$2 AND custom_field_id=$3`
  return db.none(sql, [newValue, customerId, fieldId])
}

function removeCustomField (customerId, fieldId) {
  const sql = `SELECT * FROM customer_custom_field_pairs WHERE custom_field_id=$1`
  return db.any(sql, [fieldId])
    .then(res => db.tx(t => {
      // Is the field to be removed the only one of its kind in the pairs table?
      if (_.size(res) === 1) {
        const q1 = t.none(`DELETE FROM customer_custom_field_pairs WHERE customer_id=$1 AND custom_field_id=$2`, [customerId, fieldId])
        const q2 = t.none(`UPDATE custom_field_definitions SET active = false WHERE id=$1`, [fieldId])
        return t.batch([q1, q2])
      } else {
        const q1 = t.none(`DELETE FROM customer_custom_field_pairs WHERE customer_id=$1 AND custom_field_id=$2`, [customerId, fieldId])
        return t.batch([q1])
      }
    }))
}

function getCustomInfoRequestsData (customer) {
  if (!customer) return
  const sql = `SELECT * FROM customers_custom_info_requests WHERE customer_id = $1`
  return db.any(sql, [customer.id]).then(res => _.set('custom_info_request_data', res, customer))
}

function enableTestCustomer (customerId) {
  const sql = `UPDATE customers SET is_test_customer=true WHERE id=$1`
  return db.none(sql, [customerId])
}

function disableTestCustomer (customerId) {
  const sql = `UPDATE customers SET is_test_customer=false WHERE id=$1`
  return db.none(sql, [customerId])
}

module.exports = {
  add,
  get,
  batch,
  getCustomersList,
  getCustomerById,
  getById,
  update,
  updateCustomer,
  updatePhotoCard,
  updateFrontCamera,
  updateIdCardData,
  addCustomField,
  saveCustomField,
  removeCustomField,
  edit,
  deleteEditedData,
  updateEditedPhoto,
  updateTxCustomerPhoto,
  enableTestCustomer,
  disableTestCustomer,
  selectLatestData,
  getEditedData
}
