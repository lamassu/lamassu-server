const fs = require('fs')
const path = require('path')
const os = require('os')

let serverConfig

try {
  const homeConfigPath = path.resolve(os.homedir(), '.lamassu', 'lamassu.json')
  serverConfig = JSON.parse(fs.readFileSync(homeConfigPath))
} catch (_) {
  try {
    const globalConfigPath = path.resolve('/etc', 'lamassu', 'lamassu.json')
    serverConfig = JSON.parse(fs.readFileSync(globalConfigPath))
  } catch (_) {
    console.log("Couldn't open config file.")
    process.exit(1)
  }
}

module.exports = serverConfig
