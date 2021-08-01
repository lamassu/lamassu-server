const hdkey = require('ethereumjs-wallet/hdkey')

const paymentPrefixPath = "m/44'/60'/0'/0'"
const defaultPrefixPath = "m/44'/60'/1'/0'"

function run (seed, targetAddress) {
  const defaultTest = defaultHdNode(seed).deriveChild(0).getWallet().getChecksumAddressString()
  console.log('Default test address: ', defaultTest)
  const limit = 10000000
  for (var i = 0; i <= limit; i++) {
    const address = newAddress(seed, i)
    console.log(address, i)
    if (address === targetAddress) {
      console.log('Found hdIndex: ', i)
      break
    }
  }
}

function newAddress (seed, hdIndex) {
  const childNode = paymentHdNode(seed).deriveChild(hdIndex)
  return childNode.getWallet().getChecksumAddressString()
}

function paymentHdNode (masterSeed) {
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(paymentPrefixPath)
}

function defaultHdNode (masterSeed) {
  if (!masterSeed) throw new Error('No master seed!')
  const key = hdkey.fromMasterSeed(masterSeed)
  return key.derivePath(defaultPrefixPath)
}

run(seed, targetAddress)
