const exec = require('child_process')

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function execCommand (cmd) {
  return new Promise(function (resolve, reject) {
    exec.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        console.log(stdout)
        console.error(stderr)
        // resolve({ stdout, stderr })
      }
    })
  })
}

module.exports = { execCommand }
