import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useState } from 'react'

import { RadioGroup } from 'src/components/inputs'
import { H2 } from 'src/components/typography'

import styles from '../../Analytics.styles'
import Graph from '../../graphs/Graph'
import LegendEntry from '../LegendEntry'

const useStyles = makeStyles(styles)

const options = [
  { code: 'topMachinesTransactions', display: 'Transactions' },
  { code: 'topMachinesVolume', display: 'Volume' }
]

const TopMachinesBarGraphHeader = ({
  title,
  period,
  data,
  machines,
  selectedMachine,
  timezone,
  currency
}) => {
  const classes = useStyles()

  const [graphType, setGraphType] = useState(options[0].code)

  const legend = {
    cashIn: <div className={classes.cashInIcon}></div>,
    cashOut: <div className={classes.cashOutIcon}></div>
  }

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
        </div>
      </div>
      <Graph
        representing={R.find(R.propEq('code', graphType), options)}
        period={period}
        data={data}
        timezone={timezone}
        currency={currency}
        selectedMachine={selectedMachine}
        machines={machines}
      />
    </>
  )
}

export default TopMachinesBarGraphHeader
