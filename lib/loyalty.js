const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')

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
    idType: it.identification,
    value: it.value,
    discount: it.discount,
    softDeleted: it.soft_deleted
  }), res))
}

function createIndividualDiscount (idType, value, discount) {
  const idTypes = {
    phone: 'phone',
    idNumber: 'id_number'
  }

  const sql = `INSERT INTO individual_discounts (id, identification, value, discount) VALUES ($1, $2, $3, $4) RETURNING *`
  return db.one(sql, [uuid.v4(), idTypes[idType], value, discount])
}

function deleteIndividualDiscount (id) {
  const sql = `UPDATE individual_discounts SET soft_deleted=true WHERE id=$1`
  return db.none(sql, [id])
}

module.exports = {
  getAvailablePromoCodes,
  getPromoCode,
  createPromoCode,
  deletePromoCode,
  getNumberOfAvailablePromoCodes,
  getAvailableIndividualDiscounts,
  createIndividualDiscount,
  deleteIndividualDiscount
}
