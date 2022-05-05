import * as R from 'ramda'

const CRYPTO_CURRENCIES = [
  {
    cryptoCode: 'BTC',
    display: 'Bitcoin',
    code: 'bitcoin',
    unitScale: 8
  },
  {
    cryptoCode: 'ETH',
    display: 'Ethereum',
    code: 'ethereum',
    unitScale: 18
  },
  {
    cryptoCode: 'LTC',
    display: 'Litecoin',
    code: 'litecoin',
    unitScale: 8
  },
  {
    cryptoCode: 'DASH',
    display: 'Dash',
    code: 'dash',
    unitScale: 8
  },
  {
    cryptoCode: 'ZEC',
    display: 'Zcash',
    code: 'zcash',
    unitScale: 8
  },
  {
    cryptoCode: 'BCH',
    display: 'Bitcoin Cash',
    code: 'bitcoincash',
    unitScale: 8
  }
]

function getCryptoCurrency(cryptoCode) {
  const coin = R.find(R.propEq('cryptoCode', cryptoCode))(CRYPTO_CURRENCIES)

  if (!coin) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return coin
}

function toUnit(cryptoAtoms, cryptoCode) {
  const cryptoRec = getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return cryptoAtoms.shiftedBy(-unitScale)
}

function formatCryptoAddress(cryptoCode = '', address = '') {
  return cryptoCode === 'BCH' ? address.replace('bitcoincash:', '') : address
}

export { toUnit, formatCryptoAddress }
