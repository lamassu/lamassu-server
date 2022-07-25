const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')

const userRoleId = uuid.v4()
const superuserRoleId = uuid.v4()

const userPermissions = [
  "bill:read",
  "blacklist:read",
  "blacklist:write",
  "blacklist:delete",
  "cashboxBatches:read",
  "cashboxBatches:download",
  "cashboxBatches:write",
  "cashboxBatches:edit",
  "config:read",
  "config:write",
  "currencies:read",
  "cryptocurrencies:read",
  "customer:read",
  "customer:edit",
  "customer:write",
  "customInfoRequests:read",
  "customInfoRequests:edit",
  "customInfoRequests:write",
  "funding:read",
  "machineLog:read",
  "machineLog:download",
  "serverLog:read",
  "serverLog:download",
  "promoCodes:read",
  "promoCodes:write",
  "promoCodes:delete",
  "individualDiscounts:read",
  "individualDiscounts:write",
  "individualDiscounts:delete",
  "machines:read",
  "machines:unpair",
  "machines:act",
  "notifications:read",
  "notifications:edit",
  "alerts:read",
  "pairing:write",
  "ratesCrypto:read",
  "ratesFiat:read",
  "smsNotices:read",
  "smsNotices:write",
  "smsNotices:edit",
  "transactions:read",
  "transactions:download",
  "transactions:cancel",
  "serverVersion:read",
  "cashOut:write"
]

const superuserPermissions = [
  ...userPermissions,
  "users:read",
  "users:write",
  "users:edit"
]

exports.up = function (next) {
  var sql = [
    // Probably simpler to leave the system_permissions primary key as a autoincrement int
    // instead of a randomly generated UUID for ease of reading
    `CREATE TABLE system_permissions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )`,
    `CREATE TABLE user_roles (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL
    )`,
    `CREATE TABLE role_permissions (
      id UUID PRIMARY KEY,
      role_id UUID NOT NULL REFERENCES user_roles(id),
      permission_id INT NOT NULL REFERENCES system_permissions(id)
    )`,
    ..._.map(it => `INSERT INTO system_permissions (name) VALUES ('${it}')`, _.uniq(_.concat(userPermissions, superuserPermissions))),
    `INSERT INTO user_roles (id, name) VALUES ('${userRoleId}', 'user')`,
    `INSERT INTO user_roles (id, name) VALUES ('${superuserRoleId}', 'superuser')`,
    `ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id)`,
    `UPDATE users SET role_id = CASE
      WHEN role = 'user'::role THEN '${userRoleId}'::UUID
      WHEN role = 'superuser'::role THEN '${superuserRoleId}'::UUID
    END`,
    `ALTER TABLE users ALTER COLUMN role_id SET NOT NULL`,
    `ALTER TABLE users DROP COLUMN role`,
    ..._.map(it => `INSERT INTO role_permissions (id, role_id, permission_id) SELECT '${uuid.v4()}'::UUID, '${userRoleId}'::UUID, id FROM system_permissions WHERE name = '${it}'`, userPermissions),
    ..._.map(it => `INSERT INTO role_permissions (id, role_id, permission_id) SELECT '${uuid.v4()}'::UUID, '${superuserRoleId}'::UUID, id FROM system_permissions WHERE name = '${it}'`, superuserPermissions)
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
