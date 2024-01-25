const _ = require('lodash/fp')
const sumService = require('@haensl/subset-sum')

const BN = require('./bn')
const logger = require('./logger')
const cc = require('./coin-change')

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

const getSolution_old = (units, amount, mode) => {
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

const getSolution = (units, amount) => {
  amount = amount.toNumber()
  units = units.map(({ denomination, count }) => [denomination, count])
  const model = cc.model(units)
  return cc.solve(model, amount)
}

const solutionToOriginalUnits = (solution, units) => {
  const billsToAssign = (count, left) => _.clamp(0, count)(_.isNaN(left) || _.isNil(left) ? 0 : left)

  const billsLeft = _.flow(
    _.map(([denomination, provisioned]) => [BN(denomination), provisioned]),
    _.reduce((acc, value) => {
        acc[value[0]] = (acc[value[0]] || BN(0)).plus(value[1])
        return acc
      },
      {}
    )
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
  const ss_solution = getSolution_old(outCassettes, amount, BILL_LIST_MODES.VALUE_ROUND_ROBIN)
  const cc_solution = getSolution(outCassettes, amount)

  if (!!ss_solution !== !!cc_solution) {
    logger.error(new Error(`subset-sum and coin-change don't agree on solvability -- subset-sum:${!!ss_solution} coin-change:${!!cc_solution}`))
    return solutionToOriginalUnits(ss_solution, outCassettes)
  }

  if (!cc.check(cc_solution, amount.toNumber())) {
    logger.error(new Error("coin-change provided a bad solution"))
    return solutionToOriginalUnits(ss_solution, outCassettes)
  }

  return solutionToOriginalUnits(cc_solution, outCassettes)
}

module.exports = { makeChange }
