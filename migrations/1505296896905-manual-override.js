'use strict'

const db = require('./db')

exports.up = function (next) {
  const sql = [
    /**
     * Replace all compliance_types enum values
     *
     * There is no ALTER TYPE name DROP/RENAME VALUE ... in psql
     * This is a way to update all the existing enum values of an existing type
     *
     * @see {@link http://blog.yo1.dog/updating-enum-values-in-postgresql-the-safe-and-easy-way/}
     */
    db.defineEnum('compliance_type', "'authorized', 'sms', 'id_card_data', 'id_card_photo', 'sanctions_check', 'front_facing_cam', 'hard_limit'"),
    db.alterColumn('compliance_authorizations', 'compliance_type', 'set data type compliance_type using compliance_type::text::compliance_type'),
    db.dropEnum('compliance_types'),

    db.defineEnum('verification_type', "'verified', 'blocked', 'automatic'"),

    db.dropColumn('customers', 'manually_verified'),
    db.addColumn('customers', 'sms_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'sms_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'sms_override_at', 'timestamptz'),
    db.addColumn('customers', 'id_card_data_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'id_card_data_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'id_card_data_override_at', 'timestamptz'),
    db.addColumn('customers', 'id_card_photo_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'id_card_photo_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'id_card_photo_override_at', 'timestamptz'),
    db.addColumn('customers', 'front_facing_cam_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'front_facing_cam_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'front_facing_cam_override_at', 'timestamptz'),
    db.addColumn('customers', 'sanctions_check_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'sanctions_check_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'sanctions_check_override_at', 'timestamptz'),
    db.addColumn('customers', 'authorized_override', 'verification_type not null default \'automatic\''),
    db.addColumn('customers', 'authorized_override_by', 'text references user_tokens (token)'),
    db.addColumn('customers', 'authorized_override_at', 'timestamptz'),
    db.addColumn('customers', 'authorized_at', 'timestamptz'),
    db.addColumn('customers', 'sanctions_check_at', 'timestamptz'),

    'alter table compliance_authorizations rename to compliance_overrides',
    db.addColumn('compliance_overrides', 'verification', 'verification_type not null'),
    db.renameColumn('compliance_overrides', 'authorized_at', 'override_at'),
    db.renameColumn('compliance_overrides', 'authorized_by', 'override_by')
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
