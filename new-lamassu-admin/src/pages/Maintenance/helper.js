import * as R from 'ramda'

import { IconButton } from 'src/components/buttons'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { fromNamespace } from 'src/utils/config'

const widthsByCashUnits = {
  2: {
    machine: 250,
    cashbox: 260,
    cassette: 300,
    unitGraph: 80,
    editWidth: 90
  },
  3: {
    machine: 220,
    cashbox: 215,
    cassette: 225,
    unitGraph: 60,
    editWidth: 90
  },
  4: {
    machine: 190,
    cashbox: 180,
    cassette: 185,
    unitGraph: 50,
    editWidth: 90
  },
  5: {
    machine: 170,
    cashbox: 140,
    cassette: 160,
    unitGraph: 45,
    editWidth: 90
  },
  6: {
    machine: 150,
    cashbox: 130,
    cassette: 142,
    unitGraph: 45,
    editWidth: 70
  },
  7: {
    machine: 140,
    cashbox: 115,
    cassette: 125,
    unitGraph: 40,
    editWidth: 70
  },
  8: {
    machine: 100,
    cashbox: 115,
    cassette: 122,
    unitGraph: 35,
    editWidth: 70
  }
}

const getMaxNumberOfCassettesMap = machines =>
  Math.max(...R.map(it => it.numberOfCassettes, machines), 0)

const getMaxNumberOfStackersMap = machines =>
  Math.max(...R.map(it => it.numberOfStackers, machines), 0)

// Each stacker counts as two cash units (front and rear)
const getMaxNumberOfCashUnits = machines =>
  Math.max(
    ...R.map(it => it.numberOfCassettes + it.numberOfStackers * 2, machines),
    0
  )

const getElements = (
  machines,
  classes,
  config,
  bills,
  setMachineId,
  setWizard
) => {
  const fillingPercentageSettings = fromNamespace('notifications', config)
  const locale = fromNamespace('locale')(config)
  const cashout = fromNamespace('cashOut')(config)
  const fiatCurrency = locale?.fiatCurrency

  const getCashoutSettings = id => fromNamespace(id)(cashout)

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.machine,
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cash box',
      width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.cashbox,
      view: (_, { id, cashUnits }) => (
        <CashIn
          currency={{ code: fiatCurrency }}
          notes={cashUnits.cashbox}
          total={R.sum(R.map(it => it.fiat, bills[id] ?? []))}
        />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  R.until(
    R.gt(R.__, getMaxNumberOfCassettesMap(machines)),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cassette ${it}`,
        width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.cassette,
        stripe: true,
        doubleHeader: 'Cash-out',
        view: (_, { id, cashUnits }) => (
          <CashOut
            className={classes.cashbox}
            denomination={getCashoutSettings(id)?.[`cassette${it}`]}
            currency={{ code: fiatCurrency }}
            notes={cashUnits[`cassette${it}`]}
            width={
              widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph
            }
            threshold={
              fillingPercentageSettings[`fillingPercentageCassette${it}`]
            }
          />
        ),
        isHidden: ({ numberOfCassettes }) => it > numberOfCassettes,
        input: CashCassetteInput,
        inputProps: {
          decimalPlaces: 0,
          width:
            widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph,
          inputClassName: classes.cashbox
        }
      })
      return R.add(1, it)
    },
    1
  )

  R.until(
    R.gt(R.__, getMaxNumberOfStackersMap(machines)),
    it => {
      elements.push(
        {
          name: `stacker${it}f`,
          header: `Stacker ${it}F`,
          width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.cassette,
          stripe: true,
          view: (_, { id, cashUnits }) => (
            <CashOut
              className={classes.cashbox}
              denomination={getCashoutSettings(id)?.[`stacker${it}f`]}
              currency={{ code: fiatCurrency }}
              notes={cashUnits[`stacker${it}f`]}
              width={
                widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph
              }
              threshold={
                fillingPercentageSettings[`fillingPercentageStacker${it}f`]
              }
            />
          ),
          isHidden: ({ numberOfStackers }) => it > numberOfStackers,
          input: CashCassetteInput,
          inputProps: {
            decimalPlaces: 0,
            width:
              widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph,
            inputClassName: classes.cashbox
          }
        },
        {
          name: `stacker${it}r`,
          header: `Stacker ${it}R`,
          width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.cassette,
          stripe: true,
          view: (_, { id, cashUnits }) => (
            <CashOut
              className={classes.cashbox}
              denomination={getCashoutSettings(id)?.[`stacker${it}r`]}
              currency={{ code: fiatCurrency }}
              notes={cashUnits[`stacker${it}r`]}
              width={
                widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph
              }
              threshold={
                fillingPercentageSettings[`fillingPercentageStacker${it}r`]
              }
            />
          ),
          isHidden: ({ numberOfStackers }) => it > numberOfStackers,
          input: CashCassetteInput,
          inputProps: {
            decimalPlaces: 0,
            width:
              widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.unitGraph,
            inputClassName: classes.cashbox
          }
        }
      )
      return R.add(1, it)
    },
    1
  )

  elements.push({
    name: 'edit',
    header: 'Edit',
    width: widthsByCashUnits[getMaxNumberOfCashUnits(machines)]?.editWidth,
    textAlign: 'center',
    view: (_, { id }) => {
      return (
        <IconButton
          onClick={() => {
            setMachineId(id)
            setWizard(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    }
  })

  return elements
}

export default { getElements }
