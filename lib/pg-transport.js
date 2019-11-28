const Transport = require('winston-transport')
const eventBus = require('./event-bus')

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
module.exports = class CustomTransport extends Transport {
  constructor (opts) {
    super(opts)

    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail,
    //   logentries, etc.).
    //
    this.tableName = opts.tableName || 'winston_logs'

    if (!opts.connectionString) {
      throw new Error('You have to define connectionString')
    }

    this.connectionString = opts.connectionString
  }

  log (level, message, meta, callback) {
    if (!callback) callback = () => {}

    setImmediate(() => {
      this.emit('logged', level, message, meta)
    })

    // Perform the writing to the remote service
    eventBus.publish('log', { level, message, meta })

    callback()
  }
}
