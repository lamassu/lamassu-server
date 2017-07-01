const fs = require('fs')
const path = require('path')
const os = require('os')
const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))

let serverConfig

try {
  const globalConfigPath = path.resolve('/etc', 'lamassu', 'lamassu.json')
  serverConfig = JSON.parse(fs.readFileSync(globalConfigPath))
} catch (_) {
  try {
    const homeConfigPath = path.resolve(os.homedir(), '.lamassu', 'lamassu.json')
    serverConfig = JSON.parse(fs.readFileSync(homeConfigPath))
  } catch (_) {
    console.error("Couldn't open lamassu.json config file.")
    process.exit(1)
  }
}

const defaults = {logLevel: 'info'}
const commandLine = {logLevel: argv.logLevel}

module.exports = _.mergeAll([defaults, serverConfig, commandLine])
