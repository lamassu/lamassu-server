const path = require('path')
const fs = require('fs')

const _ = require('lodash/fp')

const pluginCodes = {
  TICKER: 'ticker',
  EXCHANGE: 'exchange',
  WALLET: 'wallet',
  LAYER2: 'layer2',
  SMS: 'sms',
  EMAIL: 'email',
  ZERO_CONF: 'zero-conf'
}

module.exports = _.assign({load, loadSchemas}, pluginCodes)

function load (type, pluginCode) {
  if (!_.includes(type, _.values(pluginCodes))) {
    throw new Error(`Unallowed plugin type: ${type}`)
  }

  if (!pluginCode) throw new Error(`No plugin defined for ${type}`)

  if (pluginCode.search(/[a-z0-9-]/) === -1) {
    throw new Error(`Unallowed plugin name: ${pluginCode}`)
  }

  return require(`./plugins/${type}/${pluginCode}/${pluginCode}`)
}

function loadSchemas () {
  const schemasRoot = path.resolve(__dirname, '..', 'schemas')
  const schemaFiles = fs.readdirSync(schemasRoot)
  const stripJson = fileName => fileName.slice(0, -5)
  const readSchema = fileName => JSON.parse(fs.readFileSync(path.resolve(schemasRoot, fileName)))
  return _.zipObject(_.map(stripJson, schemaFiles), _.map(readSchema, schemaFiles))
}
