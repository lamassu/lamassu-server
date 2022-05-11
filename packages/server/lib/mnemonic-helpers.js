const bip39 = require('bip39')
const os = require('os')

function fromSeed (seed) {
  const words = bip39.entropyToMnemonic(seed).split(' ')

  let mnemonic = ''
  for (let i = 0; i < words.length; i += 6) {
    mnemonic += words.slice(i, i + 6).join(' ') + os.EOL
  }
  return mnemonic
}

function toEntropyBuffer (mnemonic) {
  const hex = bip39.mnemonicToEntropy(mnemonic.split('\n').join(' ').trim())
  return Buffer.from(hex.trim(), 'hex')
}

module.exports = { toEntropyBuffer, fromSeed }
