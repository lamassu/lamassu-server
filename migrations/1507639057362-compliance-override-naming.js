'use strict'

const db = require('./db')

exports.up = function (next) {
  const sql = [
    db.renameColumn('customers', 'id_card_number', 'id_card_data_number'),
    db.renameColumn('customers', 'id_card_at', 'id_card_data_at'),
    db.renameColumn('customers', 'sanctions_check', 'sanctions'),
    db.renameColumn('customers', 'sanctions_check_at', 'sanctions_at'),
    db.renameColumn('customers', 'front_facing_cam_at', 'front_camera_at'),
    db.renameColumn('customers', 'front_facing_cam_path', 'front_camera_path'),
    db.renameColumn('customers', 'id_card_image_path', 'id_card_photo_path'),
    db.renameColumn('customers', 'id_card_image_at', 'id_card_photo_at'),
    db.renameColumn('customers', 'id_card_expiration', 'id_card_data_expiration'),
    db.renameColumn('customers', 'front_facing_cam_override', 'front_camera_override'),
    db.renameColumn('customers', 'front_facing_cam_override_by', 'front_camera_override_by'),
    db.renameColumn('customers', 'front_facing_cam_override_at', 'front_camera_override_at'),
    db.renameColumn('customers', 'sanctions_check_override', 'sanctions_override'),
    db.renameColumn('customers', 'sanctions_check_override_by', 'sanctions_override_by'),
    db.renameColumn('customers', 'sanctions_check_override_at', 'sanctions_override_at'),
    /**
     * Replace all compliance_type enum values
     *
     * There is no ALTER TYPE name DROP/RENAME VALUE ... in psql
     * This is a way to update all the existing enum values of an existing type
     *
     * @see {@link http://blog.yo1.dog/updating-enum-values-in-postgresql-the-safe-and-easy-way/}
     */
    db.renameEnum('compliance_type', 'old_compliance_type'),
    db.defineEnum('compliance_type', "'authorized', 'sms', 'id_card_data', 'id_card_photo', 'sanctions', 'front_camera', 'hard_limit'"),
    db.alterColumn('compliance_overrides', 'compliance_type', 'set data type compliance_type using compliance_type::text::compliance_type'),
    db.dropEnum('old_compliance_type')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
