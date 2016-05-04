const E = function generateError (name) {
  var CustomErr = function (msg) {
    this.message = msg
    this.name = name
    Error.captureStackTrace(this, CustomErr)
  }
  CustomErr.prototype = Object.create(Error.prototype)
  CustomErr.prototype.constructor = CustomErr

  return CustomErr
}

module.exports = E

function register (errorName) {
  E[errorName] = E(errorName)
}

register('BadNumberError')
