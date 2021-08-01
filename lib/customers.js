const uuid = require('uuid')
const Pgp = require('pg-promise')()
const _ = require('lodash/fp')
const crypto = require('crypto')
const makeDir = require('make-dir')
const path = require('path')
const fs = require('fs')
const util = require('util')
const moment = require('moment')

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
    .then(addComplianceOverrides(id, updateData, userToken))
    .then(populateOverrideUsernames)
    .then(computeStatus)
    .then((it) => populateDailyVolume(it, txId))
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
      'suspended_until'
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
      .catch(console.error)
  }
  invalidateCustomerNotifications(id, formattedData)
  return getCustomerById(id)
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
  let startDate = moment()
  startDate = startDate.subtract(1, 'days')

  const cashInMoment = moment(cashInDate || startDate)
  const cashOutMoment = moment(cashOutDate || startDate)

  const cashInDuration = moment.duration(cashInMoment.diff(startDate)).asHours()
  const cashOutDuration = moment.duration(cashOutMoment.diff(startDate)).asHours()

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
  sanctions_override, total_txs, total_spent, created AS last_active, fiat AS last_tx_fiat,
  fiat_code AS last_tx_fiat_code, tx_class AS last_tx_class
  FROM (
    SELECT c.id, c.authorized_override,
    greatest(0, date_part('day', c.suspended_until - now())) AS days_suspended,
    c.suspended_until > now() AS is_suspended,
    c.front_camera_path, c.front_camera_override,
    c.phone, c.sms_override, c.id_card_data, c.id_card_data_override, c.id_card_data_expiration,
    c.id_card_photo_path, c.id_card_photo_override, c.us_ssn, c.us_ssn_override, c.sanctions,
    c.sanctions_at, c.sanctions_override, t.tx_class, t.fiat, t.fiat_code, t.created, 
    row_number() OVER (partition by c.id order by t.created desc) AS rn,
    coalesce(sum(case when error_code is null or error_code not in ($1^) then t.fiat else 0 end) over (partition by c.id), 0) as total_spent
    sum(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) OVER (partition by c.id) AS total_txs,
    coalesce(sum(t.fiat) OVER (partition by c.id), 0) AS total_spent
    FROM customers c LEFT OUTER JOIN (
      SELECT 'cashIn' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_in_txs WHERE send_confirmed = true UNION
      SELECT 'cashOut' AS tx_class, id, fiat, fiat_code, created, customer_id, error_code
      FROM cash_out_txs WHERE confirmed_at IS NOT NULL) t ON c.id = t.customer_id
    WHERE c.id != $2
  ) AS cl WHERE rn = 1
  AND ($4 IS NULL OR phone = $4)
  AND ($5 IS NULL OR  concat(id_card_data::json->>'firstName', ' ', id_card_data::json->>'lastName') = $5 OR id_card_data::json->>'firstName' = $5 OR id_card_data::json->>'lastName' = $5)
  AND ($6 IS NULL OR  id_card_data::json->>'address' = $6)
  AND ($7 IS NULL OR  id_card_data::json->>'documentNumber' = $7)
  limit $3`
  return db.any(sql, [ passableErrorCdoes, anonymous.uuid, NUM_RESULTS, phone, name, address, id ])
    .then(customers => Promise.all(_.map(customer => {
      return populateOverrideUsernames(customer)
        .then(camelize)
    }, customers)))
}

/**
 * Query all customers, ordered by last activity
 * and with aggregate columns based on their
 * transactions
 *
 * @returns {array} Array of customers with it's transactions aggregations
 */
function getCustomerById (id) {
  const passableErrorCodes = _.map(Pgp.as.text, TX_PASSTHROUGH_ERROR_CODES).join(',')
  const sql = `select id, authorized_override, days_suspended, is_suspended, front_camera_path, front_camera_override,
  phone, sms_override,  id_card_data, id_card_data_override, id_card_data_expiration,
  id_card_photo_path, id_card_photo_override, us_ssn, us_ssn_override, sanctions, sanctions_at,
  sanctions_override, total_txs, total_spent, created as last_active, fiat as last_tx_fiat,
  fiat_code as last_tx_fiat_code, tx_class as last_tx_class, subscriber_info
  from (
    select c.id, c.authorized_override,
    greatest(0, date_part('day', c.suspended_until - now())) as days_suspended,
    c.suspended_until > now() as is_suspended,
    c.front_camera_path, c.front_camera_at, c.front_camera_override,
    c.phone, c.sms_override, c.id_card_data, c.id_card_data_override, c.id_card_data_expiration,
    c.id_card_photo_path, c.id_card_photo_override, c.us_ssn, c.us_ssn_override, c.sanctions,
    c.sanctions_at, c.sanctions_override, c.subscriber_info, t.tx_class, t.fiat, t.fiat_code, t.created, 
    row_number() over (partition by c.id order by t.created desc) as rn,
    sum(case when t.id is not null then 1 else 0 end) over (partition by c.id) as total_txs,
    sum(case when error_code is null or error_code not in ($1^) then t.fiat else 0 end) over (partition by c.id) as total_spent
    from customers c left outer join (
      select 'cashIn' as tx_class, id, fiat, fiat_code, created, customer_id, error_code
      from cash_in_txs where send_confirmed = true union
      select 'cashOut' as tx_class, id, fiat, fiat_code, created, customer_id, error_code
      from cash_out_txs where confirmed_at is not null) t on c.id = t.customer_id
    where c.id = $2
  ) as cl where rn = 1`
  return db.oneOrNone(sql, [passableErrorCodes, id])
    .then(populateOverrideUsernames)
    .then(camelize)
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
        .catch(err => console.log('An error ocurred while saving the image ', err))
    })
}

/**
 * @param {String} customerId customer id
 * @param {String} txId customer id
 * @param {Object} patch customer t&c photo data
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

module.exports = { add, get, batch, getCustomersList, getCustomerById, getById, update, updateCustomer, updatePhotoCard, updateFrontCamera, updateIdCardData, updateTxCustomerPhoto }
