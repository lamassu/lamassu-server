'use strict';

var ApiResponse = function(res) {
  this.response = res;
};

ApiResponse.factory = function factory(res) {
  return new ApiResponse(res);
};

module.exports = ApiResponse;

ApiResponse.prototype.respond = function respond(err, res, statusCodeOpt) {
  var statusCode = statusCodeOpt || 200;
  if (err) return this.response.json(statusCode, this._buildErr(err));
  var jsonResponse = this._buildResponse(res);
  this.response.json(statusCode, jsonResponse);
};

ApiResponse.prototype._buildErr = function _buildErr(err) {
  var message = err.message || err; 
  var name = err.name || null;

  return {err: message, errType: name};
};

ApiResponse.prototype._buildResponse = function _buildResponse(res) {
  var fullRes = res;
  fullRes = fullRes || {};
  fullRes.err = null;
  return fullRes;
};