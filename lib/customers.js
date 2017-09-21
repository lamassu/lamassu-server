const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')
const BN = require('./bn')
const anonymous = require('../lib/constants').anonymousCustomer
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

function getById (id) {
  const sql = 'select * from customers where id=$1'
  return db.oneOrNone(sql, [id])
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
 * Query all customers
 *
 * Add status as computed column,
 * which will indicate the name of the latest
 * compliance verfication completed by user.
 *
 * @returns {array} Array of customers populated with status field
 */
function batch () {
  const sql = `select 
  CASE GREATEST(
    phone_at, 
    id_card_at, 
    front_facing_cam_at, 
    id_card_image_at
  ) 
    WHEN phone_at THEN 'Phone'
    WHEN id_card_at THEN 'ID card'
    WHEN front_facing_cam_at THEN 'Front facing camera'
    WHEN id_card_image_at THEN 'ID card image'
  END AS status, * from customers 
  where id != $1
  order by created desc limit $2`
  return db.any(sql, [ anonymous.uuid, NUM_RESULTS ])
}
module.exports = { add, get, batch, getById }
