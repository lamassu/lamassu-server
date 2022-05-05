const db = require('./db')
const uuid = require('uuid')

/**
 * Create new compliance override
 *
 * @name add
 * @function
 *
 * @param {object} complianceOverride Compliance override object
 *
 * @returns {object} Newly created compliance override
 */
function add (complianceOverride) {
  const sql = `insert into compliance_overrides 
  (id, 
   customer_id, 
   compliance_type, 
   override_at, 
   override_by, 
   verification) 
   values ($1, $2, $3, now(), $4, $5) returning *`
  return db.one(sql, [
    uuid.v4(),
    complianceOverride.customerId,
    complianceOverride.complianceType,
    complianceOverride.overrideBy,
    complianceOverride.verification
  ])
}

module.exports = { add }
