const base58Validator = require('./validators').base58Validator

const base58Opts = {
  bufferLength: 21,
  mainNetPrefix: [[0x4c], [0x10]],
  testNetPrefix: [[0x8c], [0x13]]
}

function validate(address) {
  if (!address) throw new Error('No address supplied.')
  if (base58Validator('main', address, base58Opts)) return true
  if (base58Validator('test', address, base58Opts)) return true
  return false
}

export default validate
