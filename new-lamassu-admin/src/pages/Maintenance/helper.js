import * as R from 'ramda'

import { IconButton } from 'src/components/buttons'
import { CashIn, CashOutLite } from 'src/components/inputs/cashbox/Cashbox'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { fromNamespace } from 'src/utils/config'
import { getCashUnitCapacity } from 'src/utils/machine'

const getElements = (
  classes,
  config,
  bills,
  setWizard,
  widths,
  setMachineId
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
      width: widths.name,
      view: m => <>{m.name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: widths.cashbox,
      view: m => (
        <CashIn
          currency={{ code: fiatCurrency }}
          notes={m.cashUnits.cashbox}
          total={R.sum(R.map(it => it.fiat, bills[m.id ?? m.deviceId] ?? []))}
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
      width: widths.cassettes,
      view: m => {
        return (
          <div className={classes.unitsRow}>
            <div className={classes.units}>
              {R.map(it => (
                <CashOutLite
                  width={'100%'}
                  currency={{ code: fiatCurrency }}
                  notes={m.cashUnits[`cassette${it}`]}
                  denomination={
                    getCashoutSettings(m.id ?? m.deviceId)[`cassette${it}`]
                  }
                  threshold={
                    fillingPercentageSettings[`fillingPercentageCassette${it}`]
                  }
                  capacity={getCashUnitCapacity(m.model, 'cassette')}
                />
              ))(R.range(1, m.numberOfCassettes + 1))}
            </div>
            <div className={classes.units}>
              {R.map(it => (
                <>
                  <CashOutLite
                    width={'100%'}
                    currency={{ code: fiatCurrency }}
                    notes={m.cashUnits[`recycler${it * 2 - 1}`]}
                    denomination={
                      getCashoutSettings(m.id ?? m.deviceId)[
                        `recycler${it * 2 - 1}`
                      ]
                    }
                    threshold={
                      fillingPercentageSettings[
                        `fillingPercentageRecycler${it * 2 - 1}`
                      ]
                    }
                    capacity={getCashUnitCapacity(m.model, 'recycler')}
                  />
                  <CashOutLite
                    width={'100%'}
                    currency={{ code: fiatCurrency }}
                    notes={m.cashUnits[`recycler${it * 2}`]}
                    denomination={
                      getCashoutSettings(m.id ?? m.deviceId)[
                        `recycler${it * 2}`
                      ]
                    }
                    threshold={
                      fillingPercentageSettings[
                        `fillingPercentageRecycler${it * 2}`
                      ]
                    }
                    capacity={getCashUnitCapacity(m.model, 'recycler')}
                  />
                  {it !== m.numberOfRecyclers / 2 && (
                    <span className={classes.verticalLine} />
                  )}
                </>
              ))(R.range(1, m.numberOfRecyclers / 2 + 1))}
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
      width: widths.edit,
      textAlign: 'center',
      view: m => {
        return (
          <IconButton
            onClick={() => {
              !R.isNil(setMachineId) && setMachineId(m.id ?? m.deviceId)
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
