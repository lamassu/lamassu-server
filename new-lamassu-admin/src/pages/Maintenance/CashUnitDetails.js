import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React from 'react'

import Chip from 'src/components/Chip'
import { CashOut } from 'src/components/inputs'
import { Label1, TL2 } from 'src/components/typography'
import { offDarkColor } from 'src/styling/variables'
import { fromNamespace } from 'src/utils/config'
import { cashUnitCapacity, modelPrettifier } from 'src/utils/machine'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    '& > *': {
      marginRight: 40
    },
    '& > *:last-child': {
      marginRight: 0
    },
    minHeight: 120
  },
  row: {
    display: 'flex',
    flexDirection: 'row'
  },
  col: {
    display: 'flex',
    flexDirection: 'column'
  },
  machineData: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 210
  },
  billList: ({ hideMachineData }) => ({
    display: 'flex',
    flexDirection: 'column',
    minWidth: hideMachineData ? 60 : 160,
    '& > span': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      '& > p': {
        minWidth: 30
      }
    }
  }),
  unitList: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      marginRight: 20
    },
    '& > *:last-child': {
      marginRight: 0
    },
    marginTop: 10
  },
  verticalLine: {
    height: '100%',
    width: 1,
    backgroundColor: offDarkColor
  },
  label: {
    marginBottom: 10
  },
  loadingBoxes: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginBottom: 20
    },
    '& > *:last-child': {
      marginBottom: 0
    }
  }
}

const useStyles = makeStyles(styles)

const CashUnitDetails = ({
  machine,
  bills,
  currency,
  config,
  hideMachineData = false
}) => {
  const classes = useStyles({ hideMachineData })
  const billCount = R.countBy(it => it.fiat)(bills)
  const fillingPercentageSettings = fromNamespace('notifications', config)
  const cashout = fromNamespace('cashOut')(config)
  const getCashoutSettings = id => fromNamespace(id)(cashout)

  return (
    <div className={classes.wrapper}>
      {!hideMachineData && (
        <div className={classes.machineData}>
          <Label1>Machine Model</Label1>
          <span>{modelPrettifier[machine.model]}</span>
        </div>
      )}
      <div className={classes.billList}>
        <Label1>Cash box</Label1>
        {R.isEmpty(billCount) && <TL2 noMargin>Empty</TL2>}
        {R.map(it => (
          <span>
            <TL2 noMargin>{billCount[it]}</TL2>
            <Chip label={`${it} ${currency}`} />
          </span>
        ))(R.keys(billCount))}
      </div>
      <div className={classes.unitList}>
        {machine.numberOfStackers === 0 &&
          R.map(it => (
            <>
              <div className={classes.col}>
                <Label1
                  noMargin
                  className={classes.label}>{`Cassette ${it}`}</Label1>
                <CashOut
                  width={60}
                  height={40}
                  currency={{ code: currency }}
                  notes={machine.cashUnits[`cassette${it}`]}
                  denomination={
                    getCashoutSettings(machine.id ?? machine.deviceId)[
                      `cassette${it}`
                    ]
                  }
                  threshold={
                    fillingPercentageSettings[`fillingPercentageCassette${it}`]
                  }
                  capacity={cashUnitCapacity[machine.model].cassette}
                />
              </div>
              {it !== machine.numberOfCassettes && (
                <span className={classes.verticalLine} />
              )}
            </>
          ))(R.range(1, machine.numberOfCassettes + 1))}
        {machine.numberOfStackers > 0 && (
          <>
            <div className={classes.col}>
              <Label1
                noMargin
                className={classes.label}>{`Loading boxes`}</Label1>
              <div className={classes.loadingBoxes}>
                {R.map(it => (
                  <CashOut
                    width={60}
                    height={40}
                    currency={{ code: currency }}
                    notes={machine.cashUnits[`cassette${it}`]}
                    denomination={
                      getCashoutSettings(machine.id ?? machine.deviceId)[
                        `cassette${it}`
                      ]
                    }
                    threshold={
                      fillingPercentageSettings[
                        `fillingPercentageCassette${it}`
                      ]
                    }
                    capacity={cashUnitCapacity[machine.model].cassette}
                  />
                ))(R.range(1, machine.numberOfCassettes + 1))}
              </div>
            </div>
            <span className={classes.verticalLine} />
            {R.map(it => (
              <>
                <div className={classes.col}>
                  <Label1
                    noMargin
                    className={classes.label}>{`Stacker ${it}`}</Label1>
                  <div className={classes.loadingBoxes}>
                    <CashOut
                      width={60}
                      height={40}
                      currency={{ code: currency }}
                      notes={machine.cashUnits[`stacker${it}f`]}
                      denomination={
                        getCashoutSettings(machine.id ?? machine.deviceId)[
                          `stacker${it}f`
                        ]
                      }
                      threshold={
                        fillingPercentageSettings[
                          `fillingPercentageStacker${it}f`
                        ]
                      }
                      capacity={cashUnitCapacity[machine.model].stacker}
                    />
                    <CashOut
                      width={60}
                      height={40}
                      currency={{ code: currency }}
                      notes={machine.cashUnits[`stacker${it}r`]}
                      denomination={
                        getCashoutSettings(machine.id ?? machine.deviceId)[
                          `stacker${it}r`
                        ]
                      }
                      threshold={
                        fillingPercentageSettings[
                          `fillingPercentageStacker${it}r`
                        ]
                      }
                      capacity={cashUnitCapacity[machine.model].stacker}
                    />
                  </div>
                </div>
                {it !== machine.numberOfStackers && (
                  <span className={classes.verticalLine} />
                )}
              </>
            ))(R.range(1, machine.numberOfStackers + 1))}
          </>
        )}
      </div>
    </div>
  )
}

export default CashUnitDetails
