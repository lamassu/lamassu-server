function toUnit (cryptoAtoms, cryptoCode) {
  const cryptoRec = {
    cryptoCode: 'BTC',
    display: 'Bitcoin',
    code: 'bitcoin',
    unitScale: 8
  }
  const unitScale = cryptoRec.unitScale
  return cryptoAtoms.shiftedBy(-unitScale)
}

module.exports = { toUnit }
