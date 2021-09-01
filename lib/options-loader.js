const fs = require('fs')
const path = require('path')
const os = require('os')
const argv = require('minimist')(process.argv.slice(2))
const _ = require('lodash/fp')

require('dotenv').config()

const dbMapping = psqlConf => ({
  STRESS_TEST: _.replace('lamassu', 'lamassu_stress', psqlConf),
  RELEASE: _.replace('lamassu', 'lamassu_release', psqlConf),
  DEV: _.replace('lamassu', 'lamassu', psqlConf)
})

/**
 * @return {{path: string, opts: any}}
 */
function load () {
  if (process.env.LAMASSU_CONFIG) {
    const configPath = process.env.LAMASSU_CONFIG
    return {
      path: configPath,
      opts: JSON.parse(fs.readFileSync(configPath))
    }
  }

  if (argv.f) {
    const configPath = argv.f
    return {
      path: configPath,
      opts: JSON.parse(fs.readFileSync(configPath))
    }
  }

  try {
    const globalConfigPath = path.resolve('/etc', 'lamassu', 'lamassu.json')
    const config = {
      path: globalConfigPath,
      opts: JSON.parse(fs.readFileSync(globalConfigPath))
    }

    config.opts.postgresql = dbMapping(config.opts.postgresql)[process.env.LAMASSU_DB]

    return config
  } catch (_) {
    try {
      const homeConfigPath = path.resolve(os.homedir(), '.lamassu', 'lamassu.json')
      const config = {
        path: homeConfigPath,
        opts: JSON.parse(fs.readFileSync(homeConfigPath))
      }

      config.opts.postgresql = dbMapping(config.opts.postgresql)[process.env.LAMASSU_DB]

      return config
    } catch (_) {
      console.error("Couldn't open lamassu.json config file.")
      process.exit(1)
    }
  }
}

module.exports = load
