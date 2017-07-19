const assert = require('assert')
const _ = require('lodash/fp')

const settingsLoader = require('../lib/settings-loader')
const schema = require('../lamassu-schema.json')
const newFields = []

const DEFAULT_CRYPTO = _.first(_.find(['code', 'cryptoCurrencies'], schema.fields).default)

assert(DEFAULT_CRYPTO)

module.exports = {run}

function run () {
  return Promise.resolve()
  .then(() => {
    schema.groups.forEach(group => {
      return group.fields.forEach(fieldCode => {
        const field = schema.fields.find(r => r.code === fieldCode)
        if (!field) throw new Error('No such field: ' + fieldCode)
        if (_.isNil(field.default)) return
        if (group.machineScope === 'specific') return

        const crypto = group.cryptoScope === 'specific'
        ? DEFAULT_CRYPTO
        : 'global'

        return newFields.push({
          fieldLocator: {
            fieldScope: {
              crypto,
              machine: 'global'
            },
            code: fieldCode,
            fieldType: field.fieldType,
            fieldClass: field.fieldClass
          },
          fieldValue: {
            fieldType: field.fieldType,
            value: field.default
          }
        })
      })
    })

    return settingsLoader.save(newFields)
  })
}
