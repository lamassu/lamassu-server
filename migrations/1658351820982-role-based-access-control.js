const db = require('./db')
const uuid = require('uuid')
const _ = require('lodash/fp')

const userRoleId = uuid.v4()
const superuserRoleId = uuid.v4()

const userPermissions = [
  { name: 'accounts:read', description: 'Read and access the 3rd party services configuration.' },
  { name: 'accounts:update', description: 'Alter or add new 3rd party services configuration.' },
  { name: 'advancedWallet:read', description: 'Read and access the advanced wallet configuration.' },
  { name: 'advancedWallet:update', description: 'Modify the advanced wallet configuration.' },
  { name: 'alerts:read', description: 'Read system alerts.' },
  { name: 'bill:read', description: 'Read bill information.' },
  { name: 'blacklist:create', description: 'Blacklist an address.' },
  { name: 'blacklist:delete', description: 'Remove an address from blacklisting.' },
  { name: 'blacklist:read', description: 'Read blacklisted addresses.' },
  { name: 'cashIn:read', description: 'Read cash-in configuration.' },
  { name: 'cashIn:update', description: 'Edit the cash-in configuration, such as the cash box reset option.' },
  { name: 'cashOut:read', description: 'Read the cash-out configuration for all machines and their respective cassette info.' },
  { name: 'cashOut:update', description: 'Toggle cash-out support and edit cassette configuration.' },
  { name: 'cashboxBatches:create', description: 'Create new cashbox batches.' },
  { name: 'cashboxBatches:download', description: 'Download cashbox batches logs.' },
  { name: 'cashboxBatches:read', description: 'Access the cashbox batches list.' },
  { name: 'cashboxBatches:update', description: 'Edit cashbox batches.' },
  { name: 'coinAtmRadar:read', description: 'Read the Coin ATM Radar configuration.' },
  { name: 'coinAtmRadar:update', description: 'Update the Coin ATM Radar configuration.' },
  { name: 'commissions:read', description: 'Read the commissions configuration.' },
  { name: 'commissions:update', description: 'Edit commissions.' },
  { name: 'compliance:read', description: 'Read compliance configuration.' },
  { name: 'compliance:update', description: 'Change compliance configuration.' },
  { name: 'countries:read', description: 'Read the available country list.' },
  { name: 'cryptocurrencies:read', description: 'Read the available cryptocurrency list.' },
  { name: 'currencies:read', description: 'Read the available fiat currency list.' },
  { name: 'customInfoRequests:create', description: 'Allow custom information request creation.' },
  { name: 'customInfoRequests:read', description: 'Read existing custom information requests.' },
  { name: 'customInfoRequests:update', description: 'Change existing custom information requests.' },
  { name: 'customer:create', description: 'Allow the creation of customers.' },
  { name: 'customer:read', description: 'Access the customer list.' },
  { name: 'customer:update', description: 'Change customer information, such as approving/rejecting customer data, managing customer notes and editing manual data.' },
  { name: 'funding:read', description: 'Access the funding information.' },
  { name: 'individualDiscounts:create', description: 'Creation of individual discounts.' },
  { name: 'individualDiscounts:delete', description: 'Delete existing individual discounts.' },
  { name: 'individualDiscounts:read', description: 'Access existing individual discounts.' },
  { name: 'languages:read', description: 'Access the language list, for localization purposes.' },
  { name: 'locales:read', description: 'Access locale configuration.' },
  { name: 'locales:update', description: 'Change locale configuration.' },
  { name: 'machineLog:download', description: 'Download machine logs.' },
  { name: 'machineLog:read', description: 'Read the machine logs (via admin).' },
  { name: 'machines:read', description: 'Access the list of machines paired in the system.' },
  { name: 'machines:update', description: 'Execute machine-related actions such as bill count updates and system reboot.' },
  { name: 'notifications:read', description: 'Access the notifications configuration.' },
  { name: 'notifications:update', description: 'Update the notifications configuration.' },
  { name: 'operatorInfo:read', description: 'Read the operator information.' },
  { name: 'operatorInfo:update', description: 'Update the operator information.' },
  { name: 'pairing:create', description: 'Create machine pairing tokens.' },
  { name: 'pairing:delete', description: 'Unpair machines from the system.' },
  { name: 'promoCodes:create', description: 'Create promotional codes.' },
  { name: 'promoCodes:delete', description: 'Remove existing promotional codes.' },
  { name: 'promoCodes:read', description: 'Access the existing promotional codes list.' },
  { name: 'ratesCrypto:read', description: 'Access the cryptocurrency trading rates.' },
  { name: 'ratesFiat:read', description: 'Access the fiat currency trading rates.' },
  { name: 'receipt:read', description: 'Access the machine receipt configuration.' },
  { name: 'receipt:update', description: 'Alter the machine receipt configuration.' },
  { name: 'serverLog:download', description: 'Download server logs.' },
  { name: 'serverLog:read', description: 'Read the server logs (via admin).' },
  { name: 'serverVersion:read', description: 'Read the current server version.' },
  { name: 'smsNotices:create', description: 'Create SMS notices.' },
  { name: 'smsNotices:read', description: 'Access existing SMS notices.' },
  { name: 'smsNotices:update', description: 'Update SMS notices configuration.' },
  { name: 'termsAndConditions:read', description: 'Access the Terms and Conditions configuration.' },
  { name: 'termsAndConditions:update', description: 'Change the Terms and Conditions configuration.' },
  { name: 'transactions:cancel', description: 'Cancel transactions (both cash-in and cash-out).' },
  { name: 'transactions:download', description: 'Download raw transactions (and relevant surrounding information) logs' },
  { name: 'transactions:read', description: 'Access the transactions list.' },
  { name: 'triggers:read', description: 'Read the compliance triggers list.' },
  { name: 'triggers:update', description: 'Create triggers and change the compliance triggers list.' },
  { name: 'triggersConfig:read', description: 'Access the compliance triggers configuration.' },
  { name: 'triggersConfig:update', description: 'Update the compliance triggers configuration.' },
  { name: 'wallets:read', description: 'Read the existing wallets configuration.' },
  { name: 'wallets:update', description: 'Change the wallets configuration.' }
]

const superuserPermissions = [
  ...userPermissions,
  { name: "users:update", description: 'Manage existing users, allowing for reset link creation, user enabling/disabling and session management.' },
  { name: "users:read", description: 'Access system user information.' },
  { name: "users:create", description: 'Create new users.' }
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
    ..._.map(it => `INSERT INTO system_permissions (name, description) VALUES ('${it.name}', '${it.description}')`, _.uniq(_.concat(userPermissions, superuserPermissions))),
    `INSERT INTO user_roles (id, name) VALUES ('${userRoleId}', 'user')`,
    `INSERT INTO user_roles (id, name) VALUES ('${superuserRoleId}', 'superuser')`,
    `ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id)`,
    `UPDATE users SET role_id = CASE
      WHEN role = 'user'::role THEN '${userRoleId}'::UUID
      WHEN role = 'superuser'::role THEN '${superuserRoleId}'::UUID
    END`,
    `ALTER TABLE users ALTER COLUMN role_id SET NOT NULL`,
    `ALTER TABLE users DROP COLUMN role`,
    `ALTER TABLE user_register_tokens ADD COLUMN role_id UUID REFERENCES user_roles(id)`,
    `UPDATE user_register_tokens SET role_id = CASE
      WHEN role = 'user'::role THEN '${userRoleId}'::UUID
      WHEN role = 'superuser'::role THEN '${superuserRoleId}'::UUID
    END`,
    `ALTER TABLE user_register_tokens DROP COLUMN role`,
    ..._.map(it => `INSERT INTO role_permissions (id, role_id, permission_id) SELECT '${uuid.v4()}'::UUID, '${userRoleId}'::UUID, id FROM system_permissions WHERE name = '${it.name}'`, userPermissions),
    ..._.map(it => `INSERT INTO role_permissions (id, role_id, permission_id) SELECT '${uuid.v4()}'::UUID, '${superuserRoleId}'::UUID, id FROM system_permissions WHERE name = '${it.name}'`, superuserPermissions),
    `DROP TYPE role`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
