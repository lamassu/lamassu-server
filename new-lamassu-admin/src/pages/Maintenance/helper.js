import * as R from 'ramda'

import { IconButton } from 'src/components/buttons'
import { CashIn, CashOutLite } from 'src/components/inputs/cashbox/Cashbox'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { fromNamespace } from 'src/utils/config'
import { cashUnitCapacity } from 'src/utils/machine'

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
      width: 250,
      view: m => <>{m.name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: 200,
      view: m => (
        <CashIn
          currency={{ code: fiatCurrency }}
          notes={m.cashUnits.cashbox}
          total={R.sum(R.map(it => it.fiat, bills[m.id] ?? []))}
          width={25}
          height={45}
          omitInnerPercentage
          className={classes.padding}
        />
      ),
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'cassettes',
      header: 'Cassettes & Recyclers',
      width: 575,
      view: m => {
        return (
          <div className={classes.unitsRow}>
            <div className={classes.units}>
              {R.map(it => (
                <CashOutLite
                  width={'100%'}
                  currency={{ code: fiatCurrency }}
                  notes={m.cashUnits[`cassette${it}`]}
                  denomination={getCashoutSettings(m.id)[`cassette${it}`]}
                  threshold={
                    fillingPercentageSettings[`fillingPercentageCassette${it}`]
                  }
                  capacity={cashUnitCapacity[m.model].cassette}
                />
              ))(R.range(1, m.numberOfCassettes + 1))}
            </div>
            <div className={classes.units}>
              {R.map(it => (
                <>
                  <CashOutLite
                    width={'100%'}
                    currency={{ code: fiatCurrency }}
                    notes={m.cashUnits[`stacker${it}f`]}
                    denomination={getCashoutSettings(m.id)[`stacker${it}f`]}
                    threshold={
                      fillingPercentageSettings[
                        `fillingPercentageStacker${it}f`
                      ]
                    }
                    capacity={cashUnitCapacity[m.model].stacker}
                  />
                  <CashOutLite
                    width={'100%'}
                    currency={{ code: fiatCurrency }}
                    notes={m.cashUnits[`stacker${it}r`]}
                    denomination={getCashoutSettings(m.id)[`stacker${it}r`]}
                    threshold={
                      fillingPercentageSettings[
                        `fillingPercentageStacker${it}r`
                      ]
                    }
                    capacity={cashUnitCapacity[m.model].stacker}
                  />
                  {it !== m.numberOfStackers && (
                    <span className={classes.verticalLine} />
                  )}
                </>
              ))(R.range(1, m.numberOfStackers + 1))}
            </div>
          </div>
        )
      },
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'edit',
      header: 'Edit',
      width: 90,
      textAlign: 'center',
      view: m => {
        return (
          <IconButton
            onClick={() => {
              setMachineId(m.id)
              setWizard(true)
            }}>
            <EditIcon />
          </IconButton>
        )
      }
    }
  ]

  return elements
}

export default { getElements }
