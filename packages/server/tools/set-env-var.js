const fs = require('fs')
const os = require('os')
const path = require('path')

const setEnvVariable = (key, value) => {
  const ENV_PATH = process.env.NODE_ENV === 'production' ? path.resolve(os.homedir(), '.lamassu', '.env') : path.resolve(__dirname, '../.env')
  const ENV_VARIABLES = fs.readFileSync(ENV_PATH, 'utf-8').split(os.EOL)
  const target = ENV_VARIABLES.indexOf(ENV_VARIABLES.find(line => line.match(new RegExp(`^${key}=`))))

  if (target < 0) {
    // The variable doesn't exist, add it
    ENV_VARIABLES.push(`${key}=${value}`)
  } else {
    // .env already has that variable set, or at least has the definition of its key
    //
    // This is currently circumventing a possible bug on dotenv
    // where the variables on this script were showing up as undefined on the first run despite the key existing,
    // while on a second run they'd appear as empty string, as intended
    ENV_VARIABLES.splice(target, 1, `${key}=${value}`)
  }

  fs.writeFileSync(ENV_PATH, ENV_VARIABLES.join(os.EOL))
}

module.exports = setEnvVariable
