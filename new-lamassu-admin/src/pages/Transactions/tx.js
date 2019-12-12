import { find } from 'lodash/fp'

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

function getCryptoCurrency (cryptoCode) {
  const cryptoCurrency = find(['cryptoCode', cryptoCode], CRYPTO_CURRENCIES)
  if (!cryptoCurrency) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return cryptoCurrency
}

function toUnit (cryptoAtoms, cryptoCode) {
  const cryptoRec = getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return cryptoAtoms.shiftedBy(-unitScale)
}

export default toUnit
