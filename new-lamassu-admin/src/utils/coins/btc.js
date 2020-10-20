const base58Validator = require('./validators').base58Validator
const bech32Validator = require('./validators').bech32Validator

const base58Opts = {
  bufferLength: 21,
  mainNetPrefix: [[0x00], [0x05]],
  testNetPrefix: [[0x6f], [0xc4]]
}

const bech32Opts = {
  mainNetPrefix: 'bc',
  testNetPrefix: 'tb'
}

const validate = address => {
  if (!address) throw new Error('No address supplied.')
  if (base58Validator('main', address, base58Opts)) return true
  if (bech32Validator('main', address, bech32Opts)) return true
  if (base58Validator('test', address, base58Opts)) return true
  if (bech32Validator('test', address, bech32Opts)) return true
  return false
}

export default validate
