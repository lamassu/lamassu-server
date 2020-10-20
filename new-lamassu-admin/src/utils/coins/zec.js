const base58Validator = require('./validators').base58Validator

const base58Opts = {
  bufferLength: 22,
  mainNetPrefix: [
    [0x1c, 0xb8], // t1
    [0x1c, 0xbd] // t3
  ],
  testNetPrefix: [
    [0x1c, 0xba], // t2
    [0x1d, 0x25] // tm
  ]
}

function validate(address) {
  if (!address) throw new Error('No address supplied.')
  if (base58Validator('main', address, base58Opts)) return true
  if (base58Validator('test', address, base58Opts)) return true
}

export default validate
