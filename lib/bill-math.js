const uuid = require('uuid')

// Custom algorith for two cassettes. For three or more denominations, we'll need
// to rethink this. Greedy algorithm fails to find *any* solution in some cases.
// Dynamic programming may be too inefficient for large amounts.
//
// We can either require canononical denominations for 3+, or try to expand
// this algorithm.
exports.makeChange = function makeChange (cassettes, amount) {
  // Note: Everything here is converted to primitive numbers,
  // since they're all integers, well within JS number range,
  // and this is way more efficient in a tight loop.

  const small = cassettes[0]
  const large = cassettes[1]

  const largeDenom = large.denomination
  const smallDenom = small.denomination
  const largeBills = Math.min(large.count, Math.floor(amount / largeDenom))
  const amountNum = amount.toNumber()

  for (let i = largeBills; i >= 0; i--) {
    const remainder = amountNum - largeDenom * i

    if (remainder % smallDenom !== 0) continue

    const smallCount = remainder / smallDenom
    if (smallCount > small.count) continue

    return [
      {provisioned: smallCount, denomination: small.denomination, id: uuid.v4()},
      {provisioned: i, denomination: largeDenom, id: uuid.v4()}
    ]
  }

  return null
}
