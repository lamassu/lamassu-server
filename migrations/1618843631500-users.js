var db = require('./db')
const constants = require('../lib/constants')

exports.up = function (next) {
  var sql = [
    `CREATE TYPE role AS ENUM('user', 'superuser')`,
    `CREATE TABLE users (
      id UUID PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password VARCHAR(100),
      role role NOT NULL DEFAULT 'user',
      enabled BOOLEAN DEFAULT true,
      twofa_code VARCHAR(100),
      temp_twofa_code VARCHAR(100),
      created TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_accessed_from TEXT,
      last_accessed_address INET )`,
    `CREATE TABLE "user_sessions" (
      "sid" VARCHAR NOT NULL COLLATE "default",
      "sess" JSON NOT NULL,
      "expire" TIMESTAMPTZ NOT NULL )
      WITH (OIDS=FALSE)`,
    `ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE`,
    `CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire")`,
    `CREATE TYPE auth_token_type AS ENUM('reset_password', 'reset_twofa')`,
    `CREATE TABLE auth_tokens (
      token TEXT NOT NULL PRIMARY KEY,
      type auth_token_type NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      expire TIMESTAMPTZ NOT NULL DEFAULT now() + interval '${constants.AUTH_TOKEN_EXPIRATION_TIME}',
      CONSTRAINT unique_userid_type UNIQUE (user_id, type)
    )`,
    `CREATE TABLE user_register_tokens (
      token TEXT NOT NULL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      role role DEFAULT 'user',
      expire TIMESTAMPTZ NOT NULL DEFAULT now() + interval '${constants.REGISTRATION_TOKEN_EXPIRATION_TIME}'
    )`,
    // migrate values from customers which reference user_tokens for data persistence
    `ALTER TABLE customers ADD COLUMN sms_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN id_card_data_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN id_card_photo_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN front_camera_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN sanctions_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN authorized_override_by_old TEXT`,
    `ALTER TABLE customers ADD COLUMN us_ssn_override_by_old TEXT`,
    `UPDATE customers SET sms_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.sms_override_by=ut.token`,
    `UPDATE customers SET id_card_data_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.id_card_data_override_by=ut.token`,
    `UPDATE customers SET id_card_photo_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.id_card_photo_override_by=ut.token`,
    `UPDATE customers SET front_camera_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.front_camera_override_by=ut.token`,
    `UPDATE customers SET sanctions_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.sanctions_override_by=ut.token`,
    `UPDATE customers SET authorized_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.authorized_override_by=ut.token`,
    `UPDATE customers SET us_ssn_override_by_old=ut.name FROM user_tokens ut
      WHERE customers.us_ssn_override_by=ut.token`,
    `ALTER TABLE customers DROP COLUMN sms_override_by`,
    `ALTER TABLE customers DROP COLUMN id_card_data_override_by`,
    `ALTER TABLE customers DROP COLUMN id_card_photo_override_by`,
    `ALTER TABLE customers DROP COLUMN front_camera_override_by`,
    `ALTER TABLE customers DROP COLUMN sanctions_override_by`,
    `ALTER TABLE customers DROP COLUMN authorized_override_by`,
    `ALTER TABLE customers DROP COLUMN us_ssn_override_by`,
    `ALTER TABLE customers ADD COLUMN sms_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN id_card_data_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN id_card_photo_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN front_camera_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN sanctions_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN authorized_override_by UUID REFERENCES users(id)`,
    `ALTER TABLE customers ADD COLUMN us_ssn_override_by UUID REFERENCES users(id)`,
    // migrate values from compliance_overrides which reference user_tokens for data persistence
    `ALTER TABLE compliance_overrides ADD COLUMN override_by_old TEXT`,
    `UPDATE compliance_overrides SET override_by_old=ut.name FROM user_tokens ut
      WHERE compliance_overrides.override_by=ut.token`,
    `ALTER TABLE compliance_overrides DROP COLUMN override_by`,
    `ALTER TABLE compliance_overrides ADD COLUMN override_by UUID REFERENCES users(id)`,
    `DROP TABLE IF EXISTS one_time_passes`,
    `DROP TABLE IF EXISTS user_tokens`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
