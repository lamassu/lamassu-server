const xmlrpc = require('xmlrpc')
const logger = require('../logger')
const { promisify } = require('util')

// TODO new-admin: add the following to supervisor config
// [inet_http_server]
// port = 127.0.0.1:9001

function getAllProcessInfo () {
  const convertStates = (state) => {
    // From http://supervisord.org/subprocess.html#process-states
    switch (state) {
      case 'STOPPED':
        return 'STOPPED'
      case 'STARTING':
        return 'RUNNING'
      case 'RUNNING':
        return 'RUNNING'
      case 'BACKOFF':
        return 'FATAL'
      case 'STOPPING':
        return 'STOPPED'
      case 'EXITED':
        return 'STOPPED'
      case 'UNKNOWN':
        return 'FATAL'
      default:
        logger.error(`Supervisord returned an unsupported state: ${state}`)
        return 'FATAL'
    }
  }

  const client = xmlrpc.createClient({
    host: 'localhost',
    port: '9001',
    path: '/RPC2'
  })

  client.methodCall[promisify.custom] = (method, params) => {
    return new Promise((resolve, reject) => client.methodCall(method, params, (err, value) => {
      if (err) reject(err)
      else resolve(value)
    }))
  }

  return promisify(client.methodCall)('supervisor.getAllProcessInfo', [])
    .then((value) => {
      return value.map(process => (
        {
          name: process.name,
          state: convertStates(process.statename),
          uptime: (process.statename === 'RUNNING') ? process.now - process.start : 0
        }
      ))
    })
    .catch((error) => {
      if (error.code === 'ECONNREFUSED') logger.error('Failed to connect to supervisord HTTP server.')
      else logger.error(error)
    })
}

module.exports = { getAllProcessInfo }
