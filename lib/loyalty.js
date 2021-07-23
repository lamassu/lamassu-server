const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')
const pgp = require('pg-promise')()

function getAvailablePromoCodes () {
  const sql = `SELECT * FROM coupons WHERE soft_deleted=false`
  return db.any(sql)
}

function getPromoCode (code) {
  const sql = `SELECT * FROM coupons WHERE code=$1 AND soft_deleted=false`
  return db.oneOrNone(sql, [code])
}

function createPromoCode (code, discount) {
  const sql = `INSERT INTO coupons (id, code, discount) VALUES ($1, $2, $3) RETURNING *`
  return db.one(sql, [uuid.v4(), code, discount])
}

function deletePromoCode (id) {
  const sql = `UPDATE coupons SET soft_deleted=true WHERE id=$1`
  return db.none(sql, [id])
}

function getNumberOfAvailablePromoCodes () {
  const sql = `SELECT COUNT(id) FROM coupons WHERE soft_deleted=false`
  return db.one(sql).then(res => res.count)
}

function getAvailableIndividualDiscounts () {
  const sql = `SELECT * from individual_discounts WHERE soft_deleted=false`
  return db.any(sql).then(res => _.map(it => ({
    id: it.id,
    idType: _.camelCase(it.identification),
    value: it.value,
    discount: it.discount
  }), res))
}

function createIndividualDiscount (idType, value, discount) {
  const idTypes = {
    phone: 'phone',
    idNumber: 'id_number'
  }

  const sql = `INSERT INTO individual_discounts (id, identification, value, discount) VALUES ($1, $2, $3, $4)`
  return db.none(sql, [uuid.v4(), idTypes[idType], value, discount])
}

function deleteIndividualDiscount (id) {
  const sql = `UPDATE individual_discounts SET soft_deleted=true WHERE id=$1`
  return db.none(sql, [id])
}

function getCustomersWithDiscounts (discounts) {
  let phoneNumbers = []
  let idCardNumbers = []

  _.each(it => {
    switch (it.idType) {
      case 'phone':
        phoneNumbers.push(it.value)
        break
      case 'idNumber':
        idCardNumbers.push(it.value)
        break
      default:
        break
    }
  }, discounts)

  if (_.isEmpty(phoneNumbers) && _.isEmpty(idCardNumbers)) {
    return Promise.resolve([])
  }

  const phoneNumbersSql = _.map(pgp.as.text, phoneNumbers).join(',')
  const idCardNumbersSql = _.map(pgp.as.text, idCardNumbers).join(',')

  const hasPhoneNumbers = !_.isEmpty(phoneNumbers)
  const hasIDNumbers = !_.isEmpty(idCardNumbers)

  const sql = `SELECT * FROM customers WHERE ${hasPhoneNumbers ? `phone IN ($1^)` : ``} ${hasPhoneNumbers && hasIDNumbers ? `OR` : ``} ${hasIDNumbers ? `id_card_data_number IN ($2^)` : ``}`
  return db.any(sql, [phoneNumbersSql, idCardNumbersSql])
    .then(res => _.map(it => it ? _.mapKeys(_.camelCase, it) : null, res))
}

module.exports = {
  getAvailablePromoCodes,
  getPromoCode,
  createPromoCode,
  deletePromoCode,
  getNumberOfAvailablePromoCodes,
  getAvailableIndividualDiscounts,
  createIndividualDiscount,
  deleteIndividualDiscount,
  getCustomersWithDiscounts
}
