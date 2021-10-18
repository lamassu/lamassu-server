const uuid = require('uuid')
const _ = require('lodash/fp')

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

  return _.size(cassettes) > 2 ? makeChangeDynamic(cassettes, amount) : makeChangeDuo(cassettes, amount)
}

function makeChangeDuo (cassettes, amount) {
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

function makeChangeDynamic (cassettes, amount) {
  while (_.size(cassettes) < 4) {
    cassettes.push({ denomination: 0, count: 0 })
  }

  const solutions = []
  const amountNum = amount.toNumber()
  for (let i = 0; i * cassettes[0].denomination <= amountNum; i++) {
    for (
      let j = 0;
      i * cassettes[0].denomination + j * cassettes[1].denomination <=
      amountNum;
      j++
    ) {
      if (cassettes[1].denomination === 0) break
      if (
        i * cassettes[0].denomination + j * cassettes[1].denomination ===
          amountNum &&
        i <= cassettes[0].count &&
        j <= cassettes[1].count &&
        i >= 0 &&
        j >= 0
      ) {
        solutions.push([
          {
            provisioned: i,
            denomination: cassettes[0].denomination,
            id: uuid.v4()
          },
          {
            provisioned: j,
            denomination: cassettes[1].denomination,
            id: uuid.v4()
          },
          {
            provisioned: 0,
            denomination: cassettes[2].denomination,
            id: uuid.v4()
          },
          {
            provisioned: 0,
            denomination: cassettes[3].denomination,
            id: uuid.v4()
          }
        ])
      }
      for (
        let k = 0;
        i * cassettes[0].denomination +
          j * cassettes[1].denomination +
          k * cassettes[2].denomination <=
        amountNum;
        k++
      ) {
        if (cassettes[2].denomination === 0) break
        if (
          i * cassettes[0].denomination +
            j * cassettes[1].denomination +
            k * cassettes[2].denomination ===
            amountNum &&
          i <= cassettes[0].count &&
          j <= cassettes[1].count &&
          k <= cassettes[2].count &&
          i >= 0 &&
          j >= 0 &&
          k >= 0
        ) {
          solutions.push([
            {
              provisioned: i,
              denomination: cassettes[0].denomination,
              id: uuid.v4()
            },
            {
              provisioned: j,
              denomination: cassettes[1].denomination,
              id: uuid.v4()
            },
            {
              provisioned: k,
              denomination: cassettes[2].denomination,
              id: uuid.v4()
            },
            {
              provisioned: 0,
              denomination: cassettes[3].denomination,
              id: uuid.v4()
            }
          ])
        }
        for (
          let l = 0;
          i * cassettes[0].denomination +
            j * cassettes[1].denomination +
            k * cassettes[2].denomination +
            l * cassettes[3].denomination <=
          amountNum;
          l++
        ) {
          if (cassettes[3].denomination === 0) break
          if (
            i * cassettes[0].denomination +
              j * cassettes[1].denomination +
              k * cassettes[2].denomination +
              l * cassettes[3].denomination ===
              amountNum &&
            i <= cassettes[0].count &&
            j <= cassettes[1].count &&
            k <= cassettes[2].count &&
            l <= cassettes[3].count &&
            i >= 0 &&
            j >= 0 &&
            k >= 0 &&
            l >= 0
          ) {
            solutions.push([
              {
                provisioned: i,
                denomination: cassettes[0].denomination,
                id: uuid.v4()
              },
              {
                provisioned: j,
                denomination: cassettes[1].denomination,
                id: uuid.v4()
              },
              {
                provisioned: k,
                denomination: cassettes[2].denomination,
                id: uuid.v4()
              },
              {
                provisioned: l,
                denomination: cassettes[3].denomination,
                id: uuid.v4()
              }
            ])
          }
        }
      }
    }
  }

  const sortedSolutions = _.sortBy(it => {
    const arr = []

    for (let la = 0; la < 4; la++) {
      arr.push(cassettes[la].count - it[la].provisioned)
    }

    if (arr.length < 2) return Infinity
    return _.max(arr) - _.min(arr)
  }, solutions)

  const cleanSolution = _.filter(
    it => it.denomination > 0,
    _.head(sortedSolutions)
  )

  return cleanSolution
}
