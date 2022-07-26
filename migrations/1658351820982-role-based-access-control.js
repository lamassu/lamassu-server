const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')

const userRoleId = uuid.v4()
const superuserRoleId = uuid.v4()

const userPermissions = [
  'accounts:read',
  'accounts:write',
  'advancedWallet:read',
  'advancedWallet:write',
  'alerts:read',
  'bill:read',
  'blacklist:delete',
  'blacklist:read',
  'blacklist:write',
  'cashIn:read',
  'cashIn:write',
  'cashOut:read',
  'cashOut:write',
  'cashboxBatches:download',
  'cashboxBatches:edit',
  'cashboxBatches:read',
  'cashboxBatches:write',
  'coinAtmRadar:read',
  'coinAtmRadar:write',
  'commissions:read',
  'commissions:write',
  'compliance:read',
  'compliance:write',
  'countries:read',
  'cryptocurrencies:read',
  'currencies:read',
  'customInfoRequests:edit',
  'customInfoRequests:read',
  'customInfoRequests:write',
  'customer:edit',
  'customer:read',
  'customer:write',
  'funding:read',
  'individualDiscounts:delete',
  'individualDiscounts:read',
  'individualDiscounts:write',
  'languages:read',
  'locales:read',
  'locales:write',
  'machineLog:download',
  'machineLog:read',
  'machines:act',
  'machines:read',
  'machines:unpair',
  'notifications:edit',
  'notifications:read',
  'notifications:read',
  'notifications:write',
  'operatorInfo:read',
  'operatorInfo:write',
  'pairing:write',
  'promoCodes:delete',
  'promoCodes:read',
  'promoCodes:write',
  'ratesCrypto:read',
  'ratesFiat:read',
  'receipt:read',
  'receipt:write',
  'serverLog:download',
  'serverLog:read',
  'serverVersion:read',
  'smsNotices:edit',
  'smsNotices:read',
  'smsNotices:write',
  'termsAndConditions:read',
  'termsAndConditions:write',
  'transactions:cancel',
  'transactions:download',
  'transactions:read',
  'triggers:read',
  'triggers:write',
  'triggersConfig:read',
  'triggersConfig:write',
  'wallets:read',
  'wallets:write'
]

const superuserPermissions = [
  ...userPermissions,
  "users:edit",
  "users:read",
  "users:write"
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
