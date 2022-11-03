const db = require('./db')

const getTestingAddresses = () => {
  return db.any(`SELECT * FROM testing_addresses`).then(res =>
    res.map(item => ({
      cryptoCode: item.crypto_code,
      address: item.address
    }))
  )
}

const deleteTestingAddress = (cryptoCode, address) => {
  const sql = `DELETE FROM testing_addresses WHERE crypto_code = $1 AND address = $2`
  return db.none(sql, [cryptoCode, address])
}

const addTestingAddress = (cryptoCode, address) => {
  return db
    .none(
      'INSERT INTO testing_addresses (crypto_code, address) VALUES ($1, $2);',
      [cryptoCode, address]
    )
}

const testing = (address, cryptoCode) => {
  const sql = `SELECT * FROM testing_addresses WHERE address = $1 AND crypto_code = $2`
  return db.any(sql, [address, cryptoCode])
}

module.exports = {
    getTestingAddresses,
    addTestingAddress,
    deleteTestingAddress,
    testing
}
