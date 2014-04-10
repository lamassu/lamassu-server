var fs = require('fs');
var path = require('path');
var https = require('https');
var fixtures = path.join(__dirname, '..', 'fixtures');

module.exports = function(handler, callback) {
  var server = https.createServer({
    key: fs.readFileSync(path.join(fixtures, 'privatekey.pem')),
    cert: fs.readFileSync(path.join(fixtures, 'certificate.pem'))
  }, handler);
  server.listen(0, function() {
    callback(null, server);
  });
};
