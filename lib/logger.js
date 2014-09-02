var bunyan  = require('bunyan');
var async   = require('async');

var logLevel = process.env.LAMASSU_ENV === 'debug' ?
  'debug' :
  'info';

var bunyan = bunyan.createLogger({name: 'lamassu-server', level: logLevel});


// log version
var version = require('../package.json').version;
bunyan.info('Version:', version);


// log twitter stuff (optional)
function wrapper(fn) {
  return function(cb) {
    fn(function(value) {
      cb(null, value);
    });
  }
}
try {
  var git = require('git-rev');
  async.parallel([
    wrapper(git.branch),
    wrapper(git.short)
  ],
  function(err, values) {
    bunyan.info('Git:', '#' + values[0], '@' + values[1]);
  });
} catch(_) {}


module.exports = bunyan;
