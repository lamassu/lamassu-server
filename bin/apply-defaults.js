const _ = require('lodash/fp')

// const db = require('../lib/db')
const settingsLoader = require('../lib/settings-loader')
const configManager = require('../lib/config-manager')
const schema = require('../lamassu-schema.json')
const newFields = []

settingsLoader.loadConfig()
.then(config => {
  schema.groups.forEach(group => {
    return group.fields.forEach(fieldCode => {
      const field = schema.fields.find(r => r.code === fieldCode)
      if (!field) throw new Error('No such field: ' + fieldCode)
      if (_.isNil(field.default)) return
      if (group.cryptoScope === 'specific' || group.machineScope === 'specific') return

      const existing = configManager.scopedValue('global', 'global', fieldCode, config)
      if (existing) return

      return newFields.push({
        fieldLocator: {
          fieldScope: {
            crypto: 'global',
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

  return settingsLoader.save(config.concat(newFields))
})
.then(() => pp(newFields))
.then(() => process.exit(0))

function pp (o) { console.log(require('util').inspect(o, {depth: null, colors: true})) }
