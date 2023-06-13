const _ = require('lodash/fp')

const db = require('./db')
const { saveConfig, loadLatest, removeFromConfig } = require('../lib/new-settings-loader')

exports.up = function (next) {
  var sql = config => [
    `CREATE TYPE notification_event AS ENUM (
      'cryptoBalance',
      'unitFillThreshold',
      'transactionValue',
      'transactionFinished',
      'customerCreated',
      'customerCompliance',
      'physicalUnitMoved',
      'machineState',
      'billIssue'
    )`,
    `CREATE TYPE notification_category AS ENUM (
      'balance',
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
    )`,
    `CREATE TABLE notification_channel_preferences (
      channel notification_channel PRIMARY KEY,
      active BOOLEAN NOT NULL
    )`,
    `CREATE TABLE notification_preferences (
      event notification_event NOT NULL,
      category notification_category NOT NULL,
      channel notification_channel NOT NULL,
      active BOOLEAN NOT NULL,
      PRIMARY KEY(event, category, channel)
    )`,
    `INSERT INTO notification_channel_preferences (channel, active) VALUES ('sms', ${_.defaultTo(false, config.notifications_sms_active)})`,
    `INSERT INTO notification_channel_preferences (channel, active) VALUES ('email', ${_.defaultTo(false, config.notifications_email_active)})`,
    `INSERT INTO notification_channel_preferences (channel, active) VALUES ('admin', ${_.defaultTo(false, config.notifications_admin_active)})`,
    `INSERT INTO notification_channel_preferences (channel, active) VALUES ('sms', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('cryptoBalance', 'balance', 'sms', ${_.defaultTo(false, config.notifications_sms_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('cryptoBalance', 'balance', 'email', ${_.defaultTo(false, config.notifications_email_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('cryptoBalance', 'balance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('cryptoBalance', 'balance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unitFillThreshold', 'balance', 'sms', ${_.defaultTo(false, config.notifications_sms_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unitFillThreshold', 'balance', 'email', ${_.defaultTo(false, config.notifications_email_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unitFillThreshold', 'balance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_balance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('unitFillThreshold', 'balance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionValue', 'transactions', 'sms', ${_.defaultTo(false, config.notifications_sms_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionValue', 'transactions', 'email', ${_.defaultTo(false, config.notifications_email_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionValue', 'transactions', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionValue', 'transactions', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionFinished', 'transactions', 'sms', ${_.defaultTo(false, config.notifications_sms_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionFinished', 'transactions', 'email', ${_.defaultTo(false, config.notifications_email_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionFinished', 'transactions', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_transactions)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('transactionFinished', 'transactions', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCreated', 'compliance', 'sms', ${_.defaultTo(false, config.notifications_sms_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCreated', 'compliance', 'email', ${_.defaultTo(false, config.notifications_email_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCreated', 'compliance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCreated', 'compliance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCompliance', 'compliance', 'sms', ${_.defaultTo(false, config.notifications_sms_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCompliance', 'compliance', 'email', ${_.defaultTo(false, config.notifications_email_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCompliance', 'compliance', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_compliance)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('customerCompliance', 'compliance', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physicalUnitMoved', 'security', 'sms', ${_.defaultTo(false, config.notifications_sms_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physicalUnitMoved', 'security', 'email', ${_.defaultTo(false, config.notifications_email_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physicalUnitMoved', 'security', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_security)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('physicalUnitMoved', 'security', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machineState', 'system', 'sms', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machineState', 'system', 'email', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machineState', 'system', 'admin', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('machineState', 'system', 'webhook', false)`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('billIssue', 'errors', 'sms', ${_.defaultTo(false, config.notifications_sms_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('billIssue', 'errors', 'email', ${_.defaultTo(false, config.notifications_email_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('billIssue', 'errors', 'admin', ${_.defaultTo(false, config.notifications_notificationCenter_errors)})`,
    `INSERT INTO notification_preferences (event, category, channel, active) VALUES ('billIssue', 'errors', 'webhook', false)`,
    `CREATE TABLE notification_settings (
      event notification_event NOT NULL,
      override_id UUID NOT NULL,
      value JSONB,
      PRIMARY KEY (event, override_id)
    )`,
    `CREATE TABLE notification_alert (
      id UUID PRIMARY KEY,
      event notification_event NOT NULL,
      category notification_category NOT NULL,
      context JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      read BOOLEAN NOT NULL DEFAULT false
    )`,
    `INSERT INTO notification_settings (event, override_id, value) VALUES ('unitFillThreshold', '00000000-0000-0000-0000-000000000000', '{ "cashboxCountUpperBound": ${_.defaultTo(null, config.notifications_cashInAlertThreshold)}, "cassettesCountLowerBound": [${_.defaultTo(null, config.notifications_fillingPercentageCassette1)}, ${_.defaultTo(null, config.notifications_fillingPercentageCassette2)}, ${_.isEmpty(config.notifications_fillingPercentageCassette3) ? null : _.defaultTo(null, config.notifications_fillingPercentageCassette3)}, ${_.isEmpty(config.notifications_fillingPercentageCassette4) ? null : _.defaultTo(null, config.notifications_fillingPercentageCassette4)}] }')`,
    ..._.map(it => `INSERT INTO notification_settings (event, override_id, value) VALUES ('unitFillThreshold', '${it.id}', '{ "machine": "${it.machine}", "cashboxCountUpperBound": ${_.defaultTo(null, it.cashInAlertThreshold)}, "cassettesCountLowerBound": [${_.defaultTo(null, it.fillingPercentageCassette1)}, ${_.defaultTo(null, it.fillingPercentageCassette2)}, ${_.defaultTo(null, it.fillingPercentageCassette3)}, ${_.defaultTo(null, it.fillingPercentageCassette4)}] }')`)(config.notifications_fiatBalanceOverrides),
    `INSERT INTO notification_settings (event, override_id, value) VALUES ('transactionValue', '00000000-0000-0000-0000-000000000000', '{ "upperBound": ${_.defaultTo(null, config.notifications_highValueTransaction)} }')`,
    `INSERT INTO notification_settings (event, override_id, value) VALUES ('cryptoBalance', '00000000-0000-0000-0000-000000000000', '{ "upperBound": ${_.defaultTo(null, config.notifications_cryptoHighBalance)}, "lowerBound": ${_.defaultTo(null, config.notifications_cryptoLowBalance)} }')`,
    ..._.map(it => `INSERT INTO notification_settings (event, override_id, value) VALUES ('cryptoBalance', '${it.id}', '{ "cryptoCurrency": "${_.defaultTo(null, it.cryptoCurrency)}", "upperBound": ${_.defaultTo(null, it.highBalance)}, "lowerBound": ${_.defaultTo(null, it.lowBalance)} }')`)(config.notifications_cryptoBalanceOverrides),
  ]

  return loadLatest()
    .then(({ config }) => db.multi(sql(config), next).then(() => config))
    .then(config => {
      return removeFromConfig(_.filter(it => _.startsWith('notifications_')(it))(_.keys(config)))
    })
}

exports.down = function (next) {
  next()
}
