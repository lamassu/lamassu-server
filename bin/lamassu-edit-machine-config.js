#!/usr/bin/env node

require('../lib/environment-helper')
const _ = require('lodash/fp')
const inquirer = require('inquirer')
const machineConfig = require('../lib/machine-config')
const operator = require('../lib/operator')
const { setMachine } = require('../lib/machine-loader')

const getJsonPaths = obj => {
  function iter(o, p) {
    if (!_.isNil(o) && _.isObject(o) && !_.isArray(o)) {
      Object.keys(o).forEach(function (k) {
        iter(o[k], p.concat(k))
      })
      return
    }
    path[p.join('.')] = o
  }

  var path = {}
  iter(obj, [])
  return path
}

const askConfigToEdit = configs => {
  const deviceIds = _.map(it => it.deviceId)(configs)
  return inquirer.prompt({
    type: 'list',
    name: 'device',
    message: 'Select the device you wish to edit the device config of',
    choices: deviceIds
  }).then(answers => _.find(it => it.deviceId === answers.device)(configs))
}

const askConfigAction = config => {
  console.log('Your device config:')
  console.log(config.deviceConfig)
  return inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Select an action',
    choices: [
      { name: 'Edit field', value: 'edit' },
      { name: 'Add field', value: 'add' },
      new inquirer.Separator(),
      { name: 'Save and exit', value: 'save' },
      { name: 'Cancel', value: 'cancel' }
    ]
  })
    .then(answers => {
      switch (answers.action) {
        case 'edit':
          return askEditField(config).then(askConfigAction)
        case 'add':
          return askNewField(config).then(askConfigAction)
        case 'save':
          return saveConfigAndExit(config)
        case 'cancel':
          return process.exit(0)
        default:
          throw new Error('Invalid option')
      }
    })
    .catch(err => {
      console.error(err)
      return askConfigAction(config)
    })
}

const askEditField = config => {
  return inquirer.prompt({
    type: 'list',
    name: 'editField',
    message: 'Select a field to edit',
    choices: [
      ..._.keys(getJsonPaths(config.deviceConfig)),
      new inquirer.Separator(),,
      { name: 'Back', value: 'back' },
      new inquirer.Separator()
    ]
  })
    .then(answers => {
      return askValueInput(config, answers.editField)
        .then(value => [answers.editField, value])
        .then(([editField, editValue]) => _.set(`deviceConfig.${editField}`, editValue)(config))
    })
}

const askNewField = config => {
  return inquirer.prompt({
    type: 'input',
    name: 'newField',
    message: 'Write the full path of the field you wish to add (e.g. "brain.newField")'
  })
    .then(answers => {
      const path = _.split('.', answers.newField)
      const parentField = _.get(path[_.size(path) - 2])(config.deviceConfig)
      const fieldExists = !_.isNil(_.get(path[_.size(path) - 1])(config.deviceConfig))

      // Trying to rewrite an existing field
      if (fieldExists) {
        console.log('That action is not allowed, you can\'t write on an existing field')
        return config
      }

      // Trying to write to a primitive field
      if (!_.isObject(parentField) && _.size(path) > 1) {
        console.log('That action is not allowed, you can only set a child field inside an object')
        return config
      }

      return askValueInput(config, answers.newField)
        .then(value => [answers.newField, value])
        .then(([newField, newValue]) => _.set(`deviceConfig.${newField}`, newValue)(config))
    })
}

const askValueInput = (config, field) => {
  return inquirer.prompt({
    type: 'list',
    name: 'inputType',
    message: `Select a variable type for ${field}`,
    choices: [
      { name: 'Number', value: 'number' },
      { name: 'String', value: 'string' },
      { name: 'Boolean', value: 'bool' },
      { name: 'Null', value: 'null' },
      new inquirer.Separator(),
      { name: 'Back', value: 'back' },
      new inquirer.Separator()
    ]
  })
    .then(answers => {
      if (answers.inputType === 'back') return askConfigAction(config)
      if (answers.inputType === 'null') return null

      return inquirer.prompt({
        type: 'input',
        name: 'inputValue',
        message: `Input a value for field '${field}'`
      }).then(_answers => {
        const value = _answers.inputValue
        switch(answers.inputType) {
          case 'number':
            if (isNaN(value)) throw new Error(`Invalid numeric value: ${value}`)
            return _.toNumber(value)
          case 'string':
            return value
          case 'bool':
            if (value === 'false') return false
            if (value === 'true') return true
            throw new Error(`Invalid boolean value: ${value}`)
        }
      })
    })
      .catch(err => {
        console.error(err)
        return askConfigAction(config)
      })
}

const saveConfigAndExit = config => {
  return Promise.all([machineConfig.updateMachineConfig(config.deviceId, config.deviceConfig), operator.getOperatorId('middleware')])
    .then(([_, operatorId]) => setMachine({ deviceId: config.deviceId, action: 'syncDeviceConfig' }, operatorId))
    .then(() => process.exit(0))
}

return machineConfig.getMachineConfigs()
  .then(askConfigToEdit)
  .then(askConfigAction)
