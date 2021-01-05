const db = require('./db')
const uuid = require('uuid')

function getAvailableCoupons () {
  const sql = `SELECT * FROM coupons WHERE soft_deleted=false`
  return db.any(sql)
}

function getCoupon (code) {
  const sql = `SELECT * FROM coupons WHERE code=$1 AND soft_deleted=false`
  return db.oneOrNone(sql, [code])
}

function createCoupon (code, discount) {
  const sql = `INSERT INTO coupons (id, code, discount) VALUES ($1, $2, $3) RETURNING *`
  return db.one(sql, [uuid.v4(), code, discount])
}

function softDeleteCoupon (couponId) {
  const sql = `UPDATE coupons SET soft_deleted=true WHERE id=$1`
  return db.none(sql, [couponId])
}

module.exports = { getAvailableCoupons, getCoupon, createCoupon, softDeleteCoupon }
