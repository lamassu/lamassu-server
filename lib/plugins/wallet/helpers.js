const crypto = require('crypto')
const fs = require('fs')

const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('../../db')
const logger = require('../../logger')

/*
 * @brief Calls `Promise.all()` on the values of the given object
 * @param promisesObj An object whose values can be promises to be resolved
 * @returns A rejected promise, or a resolved promise of the updated object
 *          whose values are resolved
 */
const PromiseObject = promisesObj => {
  const [keys, promises] = _.unzip(_.toPairs(promisesObj))
  return Promise.all(promises)
    .then(_.flow(
      _.zip(keys),
      _.fromPairs,
    ))
}


/*
 * @brief Returns the indeces of the types @a types
 * @param types An array of strings
 * @returns An object { Type: Int }
 */
const freeAddressIndeces = (cryptoCode, walletHash, types) =>
  db.any(
    `SELECT index, type
    FROM wallet_indeces
    WHERE crypto_code = $1
      AND wallet_hash = $2
      AND type IN ($3^);`,
    [cryptoCode, walletHash, _.map(pgp.as.text, types).join(',')])
  .then(_.reduce(
    (ret, { index, type }) => _.set(type, index, ret),
    _.fromPairs(_.map(t => [t, 0], types))))


/*
 * @brief Increments an index
 * @returns The free index, before the increment
 */
const nextFreeIndex = (cryptoCode, walletHash, type) =>
  db.one(
    `INSERT INTO wallet_indeces (crypto_code, wallet_hash, type, index)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (crypto_code, wallet_hash, type) DO
    UPDATE SET index = wallet_indeces.index + 1
    RETURNING index-1 AS index;`,
    [cryptoCode, walletHash, type])


// NOTE: The size of the `wallet_hash` column of the `wallet_indeces` table is
// tied to this! If the hash algorithm changes, the column must change as well!
const computeWalletHash = mnemonic =>
  crypto.createHash('MD5').update(mnemonic).digest('hex')


const readMnemonic = () => {
  const MNEMONIC_PATH = process.env.MNEMONIC_PATH
  if (!MNEMONIC_PATH) {
    logger.error("Environment variable MNEMONIC_PATH not set")
    return null
  }

  let text = null
  try {
    text = fs.readFileSync(MNEMONIC_PATH, { encoding: 'utf8' })
  } catch (err) {
    logger.error("Failed to read mnemonic file:", err)
    return null
  }

  return text.split(/\s+/).join(' ')
}

module.exports = {
  PromiseObject,
  computeWalletHash,
  freeAddressIndeces,
  nextFreeIndex,
  readMnemonic,
}
