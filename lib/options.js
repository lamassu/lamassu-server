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
    console.log(configPath)
    options = JSON.parse(fs.readFileSync(configPath))
  } catch (err2) {
    console.log('Missing configuration file -- exiting.')
    process.exit(1)
  }
}

module.exports = options
