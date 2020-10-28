const db = require('./db')
const uuid = require('uuid')

function getAvailableCoupons () {
  const sql = `select * from coupons where soft_deleted=false`
  return db.any(sql)
}

function getCoupon (code) {
  const sql = `select * from coupons where code=$1 and soft_deleted=false`
  return db.oneOrNone(sql, [code])
}

function createCoupon (code, discount) {
  const sql = `insert into coupons (id, code, discount) values ($1, $2, $3) returning *`
  return db.one(sql, [uuid.v4(), code, discount])
}

function softDeleteCoupon (couponId) {
  const sql = `update coupons set soft_deleted=true where id=$1`
  return db.none(sql, [couponId])
}

module.exports = { getAvailableCoupons, getCoupon, createCoupon, softDeleteCoupon }
