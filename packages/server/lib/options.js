const _ = require('lodash/fp')
const argv = require('minimist')(process.argv.slice(2))
const load = require('./options-loader')

const serverConfig = load().opts
const defaults = {logLevel: 'info'}
const commandLine = {logLevel: argv.logLevel}

module.exports = _.mergeAll([defaults, serverConfig, commandLine])
