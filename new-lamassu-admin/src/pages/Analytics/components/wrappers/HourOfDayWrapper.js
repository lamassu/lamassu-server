import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'

import { RadioGroup, Select } from 'src/components/inputs'
import { H2 } from 'src/components/typography'
import { MINUTE } from 'src/utils/time'

import styles from '../../Analytics.styles'
import Graph from '../../graphs/Graph'
import LegendEntry from '../LegendEntry'

const useStyles = makeStyles(styles)

const options = [
  { code: 'hourOfDayTransactions', display: 'Transactions' },
  { code: 'hourOfDayVolume', display: 'Volume' }
]

const dayOptions = R.map(
  it => ({
    code: R.toLower(it),
    display: it
  }),
  moment.weekdays()
)

const HourOfDayBarGraphHeader = ({
  title,
  period,
  data,
  machines,
  selectedMachine,
  handleMachineChange,
  timezone,
  currency
}) => {
  const classes = useStyles()

  const [graphType, setGraphType] = useState(options[0].code)
  const [selectedDay, setSelectedDay] = useState(dayOptions[0])

  const legend = {
    cashIn: <div className={classes.cashInIcon}></div>,
    cashOut: <div className={classes.cashOutIcon}></div>
  }

  const offset = parseInt(timezone.split(':')[1]) * MINUTE

  const txsPerWeekday = R.reduce(
    (acc, value) => {
      const created = new Date(value.created)
      // console.log('before', R.clone(created))
      created.setTime(
        created.getTime() + created.getTimezoneOffset() * MINUTE + offset
      )
      // console.log('after', R.clone(created))
      switch (created.getDay()) {
        case 0:
          acc.sunday.push(value)
          break
        case 1:
          acc.monday.push(value)
          break
        case 2:
          acc.tuesday.push(value)
          break
        case 3:
          acc.wednesday.push(value)
          break
        case 4:
          acc.thursday.push(value)
          break
        case 5:
          acc.friday.push(value)
          break
        case 6:
          acc.saturday.push(value)
          break
        default:
          throw new Error('Day of week not recognized')
      }
      return acc
    },
    R.fromPairs(R.map(it => [it.code, []], dayOptions)),
    data
  )

  return (
    <>
      <div className={classes.graphHeaderWrapper}>
        <div className={classes.graphHeaderLeft}>
          <H2 noMargin>{title}</H2>
          <Box className={classes.graphLegend}>
            <LegendEntry IconElement={legend.cashIn} label={'Cash-in'} />
            <LegendEntry IconElement={legend.cashOut} label={'Cash-out'} />
          </Box>
        </div>
        <div className={classes.graphHeaderRight}>
          <RadioGroup
            options={options}
            className={classes.topMachinesRadio}
            value={graphType}
            onChange={e => setGraphType(e.target.value)}
          />
          <Select
            label="Day of the week"
            items={dayOptions}
            default={dayOptions[0]}
            selectedItem={selectedDay}
            onSelectedItemChange={setSelectedDay}
          />
          <Select
            label="Machines"
            onSelectedItemChange={handleMachineChange}
            items={machines}
            default={machines[0]}
            selectedItem={selectedMachine}
          />
        </div>
      </div>
      <Graph
        representing={R.find(it => it.code === graphType)(options)}
        period={period}
        data={txsPerWeekday[selectedDay.code]}
        timezone={timezone}
        currency={currency}
        selectedMachine={selectedMachine}
        machines={machines}
        selectedDay={selectedDay}
      />
    </>
  )
}

export default HourOfDayBarGraphHeader
