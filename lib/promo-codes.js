const db = require('./db')
const uuid = require('uuid')

function getAvailablePromoCodes () {
  const sql = `SELECT * FROM coupons WHERE soft_deleted=false`
  return db.$any(sql)
}

function getPromoCode (code) {
  const sql = `SELECT * FROM coupons WHERE code=$1 AND soft_deleted=false`
  return db.$oneOrNone(sql, [code])
}

function createPromoCode (code, discount) {
  const sql = `INSERT INTO coupons (id, code, discount) VALUES ($1, $2, $3) RETURNING *`
  return db.$one(sql, [uuid.v4(), code, discount])
}

function deletePromoCode (id) {
  const sql = `UPDATE coupons SET soft_deleted=true WHERE id=$1`
  return db.$none(sql, [id])
}

function getNumberOfAvailablePromoCodes () {
  const sql = `SELECT COUNT(id) FROM coupons WHERE soft_deleted=false`
  return db.$one(sql).then(res => res.count)
}

module.exports = { getAvailablePromoCodes, getPromoCode, createPromoCode, deletePromoCode, getNumberOfAvailablePromoCodes }
