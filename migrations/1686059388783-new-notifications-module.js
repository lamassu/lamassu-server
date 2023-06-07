const _ = require('lodash/fp')

const db = require('./db')
const { saveConfig, loadLatest, removeFromConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  var sql = config => [
    `CREATE TYPE notification_event AS ENUM (
      'crypto-balance',
      'unit-fill-threshold',
      'transaction-value',
      'transaction-finished',
      'customer-created',
      'customer-compliance',
      'physical-unit-moved',
      'machine-state',
      'bill-issue'
    )`,
    `CREATE TYPE notification_category AS ENUM (
      'transactions',
      'compliance',
      'security',
      'system',
      'errors'
    )`,
    `CREATE TYPE notification_channel AS ENUM (
      'sms',
      'email',
      'admin',
      'webhook'
    )`
    `CREATE TABLE notification_preferences (
      event notification_event NOT NULL PRIMARY KEY,
      category notification_category NOT NULL,
      channel notification_channel NOT NULL,
      active BOOLEAN NOT NULL,
      UNIQUE(event, category, channel)
    )`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('crypto-balance', 'balance', 'sms', ${_.defaultTo(false, config.notifications_sms_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('crypto-balance', 'balance', 'email', ${_.defaultTo(false, config.notifications_email_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('crypto-balance', 'balance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('crypto-balance', 'balance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unit-fill-threshold', 'balance', 'sms', ${_.defaultTo(false, config.notifications_sms_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unit-fill-threshold', 'balance', 'email', ${_.defaultTo(false, config.notifications_email_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unit-fill-threshold', 'balance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unit-fill-threshold', 'balance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-value', 'transactions', 'sms', ${_.defaultTo(false, config.notifications_sms_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-value', 'transactions', 'email', ${_.defaultTo(false, config.notifications_email_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-value', 'transactions', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-value', 'transactions', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-finished', 'transactions', 'sms', ${_.defaultTo(false, config.notifications_sms_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-finished', 'transactions', 'email', ${_.defaultTo(false, config.notifications_email_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-finished', 'transactions', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transaction-finished', 'transactions', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-created', 'compliance', 'sms', ${_.defaultTo(false, config.notifications_sms_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-created', 'compliance', 'email', ${_.defaultTo(false, config.notifications_email_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-created', 'compliance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-created', 'compliance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-compliance', 'compliance', 'sms', ${_.defaultTo(false, config.notifications_sms_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-compliance', 'compliance', 'email', ${_.defaultTo(false, config.notifications_email_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-compliance', 'compliance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customer-compliance', 'compliance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physical-unit-moved', 'security', 'sms', ${_.defaultTo(false, config.notifications_sms_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physical-unit-moved', 'security', 'email', ${_.defaultTo(false, config.notifications_email_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physical-unit-moved', 'security', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physical-unit-moved', 'security', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machine-state', 'system', 'sms', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machine-state', 'system', 'email', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machine-state', 'system', 'admin', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machine-state', 'system', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('bill-issue', 'errors', 'sms', ${_.defaultTo(false, config.notifications_sms_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('bill-issue', 'errors', 'email', ${_.defaultTo(false, config.notifications_email_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('bill-issue', 'errors', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('bill-issue', 'errors', 'webhook', false)`,
    `CREATE TABLE notification_settings (
      event notification_event NOT NULL,
      override_id UUID,
      value JSONB,
      UNIQUE (event, override_id)
    )`,
    `CREATE TABLE notification_queue (
      id UUID PRIMARY KEY,
      event notification_event NOT NULL,
      category notification_category NOT NULL,
      context JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      read_at TIMESTAMPTZ
    )`,
    `INSERT INTO notification_settings (event, value) VALUES ('unit-fill-threshold', '{ "cashboxCountUpperBound": ${_.defaultTo(null, config.notifications_cashInAlertThreshold)}, "cassettesCountLowerBound": [${_.defaultTo(null, config.notifications_fillingPercentageCassette1)}, ${_.defaultTo(null, config.notifications_fillingPercentageCassette2)}, ${_.defaultTo(null, config.notifications_fillingPercentageCassette3)}, ${_.defaultTo(null, config.notifications_fillingPercentageCassette4)}] }')`,
    ..._.map(it => `INSERT INTO notification_settings (event, override_id, value) VALUES ('unit-fill-threshold', '${it.id}' '{ "machine": "${it.machine}", "cashboxCountUpperBound": ${_.defaultTo(null, it.cashInAlertThreshold)}, "cassettesCountLowerBound": [${_.defaultTo(null, it.fillingPercentageCassette1)}, ${_.defaultTo(null, it.fillingPercentageCassette2)}, ${_.defaultTo(null, it.fillingPercentageCassette3)}, ${_.defaultTo(null, it.fillingPercentageCassette4)}] }')`)(config.notifications_fiatBalanceOverrides),
    `INSERT INTO notification_settings (event, value) VALUES ('transaction-value', '{ "upperBound": ${_.defaultTo(null, config.notifications_highValueTransaction)} }')`
    `INSERT INTO notification_settings (event, value) VALUES ('crypto-balance', '{ "upperBound": ${_.defaultTo(null, config.notifications_cryptoHighBalance)}, "lowerBound": ${_.defaultTo(null, config.notifications_cryptoLowBalance)} }')`,
    ..._.map(it => `INSERT INTO notification_settings (event, override_id, value) VALUES ('crypto-balance', '${it.id}', '{ "cryptoCurrency": "${_.defaultTo(null, it.cryptoCurrency)}", "upperBound": ${_.defaultTo(null, it.highBalance)}, "lowerBound": ${_.defaultTo(null, it.lowBalance)} }')`)(config.notifications_cryptoBalanceOverrides),
    `DROP TABLE notifications`,
    `DROP TYPE notification_type`
  ]

  return loadLatest()
    .then(config => db.multi(sql(config), next).then(() => config))
    .then(removeFromConfig(_.filter(_.startsWith('notifications_'))))
}

exports.down = function (next) {
  next()
}
