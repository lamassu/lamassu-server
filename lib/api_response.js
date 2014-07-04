'use strict';

var ApiResponse = function(config) {
  this.config = config;
  this.response = config.response;
  this.targetVersion = config.targetVersion;
  this.version = config.version;
};

ApiResponse.factory = function factory(config) {
  return new ApiResponse(config);
};

module.exports = ApiResponse;

ApiResponse.prototype.respond = function respond(err, res, statusCodeOpt) {
  var statusCode = statusCodeOpt || 200;
  if (err) return this.response.json(statusCode, this._buildErr(err));
  var jsonResponse = this._buildResponse(res);
  this.response.json(statusCode, jsonResponse);
};

ApiResponse.prototype._buildErr = function _buildErr(err) {
  // Handle err as either string or error type
  var message = err.message || err; 
  var name = err.name || null;

  if (this.targetVersion < 1) return {err: message, errType: name};
  return {err: {
      name: name,
      message: message,
      version: this.version
    }
  };
};

ApiResponse.prototype._buildResponse = function _buildResponse(res) {
  if (this.targetVersion < 1) {
    var fullRes = res;
    fullRes = fullRes || {};
    fullRes.err = null;
    return fullRes;
  }
  return {err: null, result: res || null, version: this.version};
};