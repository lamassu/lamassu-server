const uuid = require('uuid')
const _ = require('lodash')

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

  // Another note: While this greedy algorithm possibly works for all major denominations,
  // it still requires a fallback for cases where it might not provide any solution.
  // Example: Denominations: [3, 5, 10] | User inputs 4 times the [3] button, resulting in a 12 fiat tx
  // This algorithm resolves for 1 x [10], and can't resolve the remainder of 2
  const cassetteMap = _.map(cassettes, it => ({
    denomination: it.denomination
  }))
  const amountNum = amount.toNumber()

  const sortedCassettes = _.orderBy(cassetteMap, ['denomination'], ['desc'])

  const finalDist = []

  let mutableAmount = _.clone(amountNum)

  while(mutableAmount >= 0) {
    _.each(sortedCassettes, it => {
      if (mutableAmount === 0) {
        finalDist.push({ provisioned: 0, denomination: it.denomination, id: uuid.v4() })
        return
      }

      const remainder = mutableAmount % it.denomination
      const amountToSub = mutableAmount - remainder
      const numberOfBills = amountToSub / it.denomination
      mutableAmount -= amountToSub

      finalDist.push({ provisioned: numberOfBills, denomination: it.denomination, id: uuid.v4() })
      return
    })

    if (mutableAmount === 0) {
      break
    }
  }

  return finalDist
}
