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
  const cassetteMap = _.map(cassettes, it => ({
    denomination: it.denomination
  }))
  const amountNum = amount.toNumber()

  console.log('cassettes', cassettes)

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
