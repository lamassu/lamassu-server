var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create type role as ENUM('user', 'superuser')`,
    `create table users (
      id uuid PRIMARY KEY,
      username varchar(50) UNIQUE,
      password varchar(100),
      role role default 'user',
      enabled boolean default true,
      twofa_code varchar(100),
      created timestamptz not null default now(),
      last_accessed timestamptz not null default now(),
      last_accessed_from text,
      last_accessed_address inet )`,
    `CREATE TABLE "user_sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL )
      WITH (OIDS=FALSE)`,
    `ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE`,
    `CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire")`,
    `create table reset_password (
      token text not null PRIMARY KEY,
      user_id uuid references users(id) on delete cascade unique,
      expire timestamptz not null default now() + interval '30 minutes'
    )`,
    `create index "idx_reset_pw_expire" on "reset_password" ("expire")`,
    `create table reset_twofa (
      token text not null PRIMARY KEY,
      user_id uuid references users(id) on delete cascade unique,
      expire timestamptz not null default now() + interval '30 minutes'
    )`,
    `create index "idx_reset_twofa_expire" on "reset_twofa" ("expire")`,
    `create table user_register_tokens (
      token text not null PRIMARY KEY,
      username text not null unique,
      role role default 'user',
      expire timestamptz not null default now() + interval '30 minutes'
    )`,
    // migrate values from customers which reference user_tokens for data persistence
    `alter table customers add column sms_override_by_old text`,
    `alter table customers add column id_card_data_override_by_old text`,
    `alter table customers add column id_card_photo_override_by_old text`,
    `alter table customers add column front_camera_override_by_old text`,
    `alter table customers add column sanctions_override_by_old text`,
    `alter table customers add column authorized_override_by_old text`,
    `alter table customers add column us_ssn_override_by_old text`,
    `update customers set sms_override_by_old=ut.name from user_tokens ut
      where customers.sms_override_by=ut.token`,
    `update customers set id_card_data_override_by_old=ut.name from user_tokens ut
      where customers.id_card_data_override_by=ut.token`,
    `update customers set id_card_photo_override_by_old=ut.name from user_tokens ut
      where customers.id_card_photo_override_by=ut.token`,
    `update customers set front_camera_override_by_old=ut.name from user_tokens ut
      where customers.front_camera_override_by=ut.token`,
    `update customers set sanctions_override_by_old=ut.name from user_tokens ut
      where customers.sanctions_override_by=ut.token`,
    `update customers set authorized_override_by_old=ut.name from user_tokens ut
      where customers.authorized_override_by=ut.token`,
    `update customers set us_ssn_override_by_old=ut.name from user_tokens ut
      where customers.us_ssn_override_by=ut.token`,
    `alter table customers drop column sms_override_by`,
    `alter table customers drop column id_card_data_override_by`,
    `alter table customers drop column id_card_photo_override_by`,
    `alter table customers drop column front_camera_override_by`,
    `alter table customers drop column sanctions_override_by`,
    `alter table customers drop column authorized_override_by`,
    `alter table customers drop column us_ssn_override_by`,
    `alter table customers add column sms_override_by uuid references users(id)`,
    `alter table customers add column id_card_data_override_by uuid references users(id)`,
    `alter table customers add column id_card_photo_override_by uuid references users(id)`,
    `alter table customers add column front_camera_override_by uuid references users(id)`,
    `alter table customers add column sanctions_override_by uuid references users(id)`,
    `alter table customers add column authorized_override_by uuid references users(id)`,
    `alter table customers add column us_ssn_override_by uuid references users(id)`,
    // migrate values from compliance_overrides which reference user_tokens for data persistence
    `alter table compliance_overrides add column override_by_old text`,
    `update compliance_overrides set override_by_old=ut.name from user_tokens ut
      where compliance_overrides.override_by=ut.token`,
    `alter table compliance_overrides drop column override_by`,
    `alter table compliance_overrides add column override_by uuid references users(id)`,
    `drop table if exists one_time_passes`,
    `drop table if exists user_tokens`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
