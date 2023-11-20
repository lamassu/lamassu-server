const _ = require('lodash/fp')
const sumService = require('@haensl/subset-sum')

const BILL_LIST_MODES = {
  LAST_UNIT_FIRST: 0,
  FIRST_UNIT_FIRST: 1,
  LOWEST_VALUE_FIRST: 2,
  HIGHEST_VALUE_FIRST: 3,
  UNIT_ROUND_ROBIN: 4,
  VALUE_ROUND_ROBIN: 5
}

const buildBillList = (units, mode) => {
  switch (mode) {
    case BILL_LIST_MODES.LAST_UNIT_FIRST:
      return _.reduce(
        (acc, value) => {
          acc.push(..._.times(_.constant(value.denomination), value.count))
          return acc
        },
        [],
        _.reverse(units)
      )
    case BILL_LIST_MODES.FIRST_UNIT_FIRST:
      return _.reduce(
        (acc, value) => {
          acc.push(..._.times(_.constant(value.denomination), value.count))
          return acc
        },
        [],
        units
      )
    case BILL_LIST_MODES.LOWEST_VALUE_FIRST:
      return _.reduce(
        (acc, value) => {
          acc.push(..._.times(_.constant(value.denomination), value.count))
          return acc
        },
        [],
        _.orderBy(['denomination'], ['asc'])(units)
      )
    case BILL_LIST_MODES.HIGHEST_VALUE_FIRST:
      return _.reduce(
        (acc, value) => {
          acc.push(..._.times(_.constant(value.denomination), value.count))
          return acc
        },
        [],
        _.orderBy(['denomination'], ['desc'])(units)
      )
    case BILL_LIST_MODES.UNIT_ROUND_ROBIN:
      {
        const amountOfBills = _.reduce(
          (acc, value) => acc + value.count,
          0,
          units
        )
      
        const _units = _.filter(it => it.count > 0)(_.cloneDeep(units))
        const bills = []
      
        for(let i = 0; i < amountOfBills; i++) {
          const idx = i % _.size(_units)
          if (_units[idx].count > 0) {
            bills.push(_units[idx].denomination)
            _units[idx].count--
          }
      
          if (_units[idx].count === 0) {
            _units.splice(idx, 1)
          }
        }

        return bills
      }
    case BILL_LIST_MODES.VALUE_ROUND_ROBIN:
      {
        const amountOfBills = _.reduce(
          (acc, value) => acc + value.count,
          0,
          units
        )
      
        const _units = _.flow([_.filter(it => it.count > 0), _.orderBy(['denomination'], ['asc'])])(_.cloneDeep(units))
        const bills = []
      
        for(let i = 0; i < amountOfBills; i++) {
          const idx = i % _.size(_units)
          if (_units[idx].count > 0) {
            bills.push(_units[idx].denomination)
            _units[idx].count--
          }
      
          if (_units[idx].count === 0) {
            _units.splice(idx, 1)
          }
        }

        return bills
      }
    default:
      throw new Error(`Invalid mode: ${mode}`)
  }
}

const getSolution = (units, amount, mode) => {
  const billList = buildBillList(units, mode)

  if (_.sum(billList) < amount.toNumber()) {
    return []
  }
  
  const solver = sumService.subsetSum(billList, amount.toNumber())
  const solution = _.countBy(Math.floor, solver.next().value)
  return _.reduce(
    (acc, value) => {
      acc.push({ denomination: _.toNumber(value), provisioned: solution[value] })
      return acc
    },
    [],
    _.keys(solution)
  )
}

const solutionToOriginalUnits = (solution, units) => {
  const billsToAssign = (count, left) => _.clamp(0, count)(_.isNaN(left) || _.isNil(left) ? 0 : left)

  const billsLeft = _.flow(
    _.map(([denomination, provisioned]) => [BN(denomination), provisioned]),
    _.fromPairs,
  )(solution)

  return _.map(
    ({ count, name, denomination }) => {
      const provisioned = billsToAssign(count, billsLeft[denomination])
      billsLeft[denomination] -= provisioned
      return { name, denomination, provisioned }
    },
    units
  )
}

function makeChange(outCassettes, amount) {
  const solution = getSolution(outCassettes, amount, BILL_LIST_MODES.VALUE_ROUND_ROBIN)
  return solutionToOriginalUnits(solution, outCassettes)
}

module.exports = { makeChange }
