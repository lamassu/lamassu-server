const exec = require('child_process').exec

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
function execCommand (cmd) {
  return new Promise(function (resolve, reject) {
    const proc = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })

    proc.stdout.on('data', data => {
      console.log(data)
    })

    proc.stderr.on('data', data => {
      console.log(data)
    })

    proc.on('exit', code => {
      console.log('child process exited with code ' + code.toString())
    })
  })
}

module.exports = { execCommand }
