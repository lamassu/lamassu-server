const fs = require('fs')
const path = require('path')
const os = require('os')
const argv = require('minimist')(process.argv.slice(2))

const STRESS_TEST_DB = 'psql://postgres:postgres123@localhost/lamassu_stress'

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

    if (argv.testDB) {
      config.opts.postgresql = STRESS_TEST_DB
    }

    return config
  } catch (_) {
    try {
      const homeConfigPath = path.resolve(os.homedir(), '.lamassu', 'lamassu.json')
      const config = {
        path: homeConfigPath,
        opts: JSON.parse(fs.readFileSync(homeConfigPath))
      }

      if (argv.testDB) {
        config.opts.postgresql = STRESS_TEST_DB
      }

      return config
    } catch (_) {
      console.error("Couldn't open lamassu.json config file.")
      process.exit(1)
    }
  }
}

module.exports = load
