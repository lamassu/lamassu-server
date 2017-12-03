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
    `create type compliance_type as enum 
    ('authorized', 'sms', 'id_card_data', 'id_card_photo', 'sanctions_check', 'front_facing_cam', 'hard_limit')`,
    'alter table compliance_authorizations alter column compliance_type set data type compliance_type using compliance_type::text::compliance_type',
    'drop type compliance_types',

    "create type verification_type as enum ('verified', 'blocked', 'automatic')",

    'alter table customers drop column manually_verified ',
    "alter table customers add column sms_override verification_type not null default 'automatic'",
    'alter table customers add column sms_override_by text references  user_tokens (token)',
    'alter table customers add column sms_override_at timestamptz',
    "alter table customers add column id_card_data_override verification_type not null default 'automatic'",
    'alter table customers add column id_card_data_override_by text references  user_tokens (token)',
    'alter table customers add column id_card_data_override_at timestamptz',
    "alter table customers add column id_card_photo_override verification_type not null default 'automatic'",
    'alter table customers add column id_card_photo_override_by text references  user_tokens (token)',
    'alter table customers add column id_card_photo_override_at timestamptz',
    "alter table customers add column front_facing_cam_override verification_type not null default 'automatic'",
    'alter table customers add column front_facing_cam_override_by text references  user_tokens (token)',
    'alter table customers add column front_facing_cam_override_at timestamptz',
    "alter table customers add column sanctions_check_override verification_type not null default 'automatic'",
    'alter table customers add column sanctions_check_override_by text references  user_tokens (token)',
    'alter table customers add column sanctions_check_override_at timestamptz',
    "alter table customers add column authorized_override verification_type not null default 'automatic'",
    'alter table customers add column authorized_override_by text references  user_tokens (token)',
    'alter table customers add column authorized_override_at timestamptz',
    'alter table customers add column authorized_at timestamptz',
    'alter table customers add column sanctions_check_at timestamptz',

    'alter table compliance_authorizations rename to compliance_overrides',
    'alter table compliance_overrides add column verification verification_type not null',
    'alter table compliance_overrides rename column authorized_at to override_at',
    'alter table compliance_overrides rename column authorized_by to override_by'
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
