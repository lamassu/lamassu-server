'use strict'

var db = require('./db')

var exchanges = {
  exchanges: {
    settings: {
      commission: 1.0,
      compliance: {
        maximum: {
          limit: null
        }
      }
    },
    plugins: {
      current: {
        ticker: 'bitpay',
        transfer: 'bitgo',
        email: 'smtp2go',
        sms: 'twilio',
        notify: []
      },
      settings: {
        bitpay: {},
        bitgo: {}
      }
    }
  }
}

var unit = {
  brain: {
    locale: {
      currency: 'USD',
      localeInfo: {
        primaryLocale: 'en-US',
        primaryLocales: ['en-US']
      }
    }
  }
}

exports.up = function (next) {
  var sqls = [
    'CREATE TABLE IF NOT EXISTS user_config ( ' +
    'id serial PRIMARY KEY, ' +
    'type text NOT NULL, ' +
    'data json NOT NULL ' +
    ')',

    'CREATE TABLE IF NOT EXISTS devices ( ' +
    'id serial PRIMARY KEY, ' +
    'fingerprint text NOT NULL UNIQUE, ' +
    'name text, ' +
    'authorized boolean, ' +
    'unpair boolean NOT NULL DEFAULT false' +
    ')',

    'CREATE TABLE IF NOT EXISTS pairing_tokens (' +
    'id serial PRIMARY KEY, ' +
    'token text, ' +
    'created timestamp NOT NULL DEFAULT now() ' +
    ')',

    'CREATE TABLE IF NOT EXISTS users ( ' +
    'id serial PRIMARY KEY, ' +
    'userName text NOT NULL UNIQUE, ' +
    'salt text NOT NULL, ' +
    'pwdHash text NOT NULL ' +
    ')',

    'INSERT INTO user_config (type, data) ' +
    "VALUES ('exchanges', '" + JSON.stringify(exchanges) + "')",

    'INSERT INTO user_config (type, data) ' +
    "VALUES ('unit', '" + JSON.stringify(unit) + "')"
  ]

  db.multi(sqls, next)
}

exports.down = function (next) {
  next()
}
