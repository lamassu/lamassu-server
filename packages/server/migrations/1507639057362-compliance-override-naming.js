'use strict'

const db = require('./db')

exports.up = function (next) {
  const sql = [
    'alter table customers rename column id_card_number to id_card_data_number',
    'alter table customers rename column id_card_at to id_card_data_at',
    'alter table customers rename column sanctions_check to sanctions',
    'alter table customers rename column sanctions_check_at to sanctions_at',
    'alter table customers rename column front_facing_cam_at to front_camera_at',
    'alter table customers rename column front_facing_cam_path to front_camera_path',
    'alter table customers rename column id_card_image_path to id_card_photo_path',
    'alter table customers rename column id_card_image_at to id_card_photo_at',
    'alter table customers rename column id_card_expiration to id_card_data_expiration',
    'alter table customers rename column front_facing_cam_override to front_camera_override',
    'alter table customers rename column front_facing_cam_override_by to front_camera_override_by',
    'alter table customers rename column front_facing_cam_override_at to front_camera_override_at',
    'alter table customers rename column sanctions_check_override to sanctions_override',
    'alter table customers rename column sanctions_check_override_by to sanctions_override_by',
    'alter table customers rename column sanctions_check_override_at to sanctions_override_at',
    /**
     * Replace all compliance_type enum values
     *
     * There is no ALTER TYPE name DROP/RENAME VALUE ... in psql
     * This is a way to update all the existing enum values of an existing type
     *
     * @see {@link http://blog.yo1.dog/updating-enum-values-in-postgresql-the-safe-and-easy-way/}
     */
    'alter type compliance_type rename to old_compliance_type',
    `create type compliance_type as enum 
    ('authorized', 'sms', 'id_card_data', 'id_card_photo', 'sanctions', 'front_camera', 'hard_limit')`,
    'alter table compliance_overrides alter column compliance_type set data type compliance_type using compliance_type::text::compliance_type',
    'drop type old_compliance_type'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
