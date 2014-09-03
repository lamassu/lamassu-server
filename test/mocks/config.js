'use strict';

var LamassuConfig = module.exports = function (conString, pairingTokenTTL) {
};
LamassuConfig.prototype.load = function load() {

};
LamassuConfig.prototype.on = function on() {

};

LamassuConfig.prototype.isAuthorized = function isAuthorized(fingerprint, cb) {
  cb(null, true);
};
