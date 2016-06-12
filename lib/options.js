'use strict'

var fs = require('fs')
var path = require('path')
var os = require('os')

var options
var configPath

try {
  configPath = '/etc/lamassu.json'
  options = JSON.parse(fs.readFileSync(configPath))
} catch (err) {
  try {
    configPath = path.resolve(os.homedir(), '.lamassu', 'lamassu.json')
    options = JSON.parse(fs.readFileSync(configPath))
  } catch (err2) {
    console.log('Missing configuration file -- exiting.')
    process.exit(1)
  }
}

var psqlUrl = options.postgres
if (!psqlUrl) {
  console.log('Missing postgres entry in configuration file: %s', configPath)
  process.exit(2)
}

module.exports = options
