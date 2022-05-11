import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import { Select } from 'src/components/inputs'
import { H2 } from 'src/components/typography'
import { primaryColor } from 'src/styling/variables'

import styles from '../../Analytics.styles'
import Graph from '../../graphs/Graph'
import LegendEntry from '../LegendEntry'

const useStyles = makeStyles(styles)

const OverTimeDotGraphHeader = ({
  title,
  representing,
  period,
  data,
  machines,
  selectedMachine,
  handleMachineChange,
  timezone,
  currency
}) => {
  const classes = useStyles()

  const legend = {
    cashIn: <div className={classes.cashInIcon}></div>,
    cashOut: <div className={classes.cashOutIcon}></div>,
    transaction: <div className={classes.txIcon}></div>,
    average: (
      <svg height="12" width="18">
        <path
          stroke={primaryColor}
          strokeWidth="3"
          strokeDasharray="5, 2"
          d="M 5 6 l 20 0"
        />
      </svg>
    )
  }

  return (
    <>
      <div className={classes.graphHeaderWrapper}>
        <div className={classes.graphHeaderLeft}>
          <H2 noMargin>{title}</H2>
          <Box className={classes.graphLegend}>
            <LegendEntry IconElement={legend.cashIn} label={'Cash-in'} />
            <LegendEntry IconElement={legend.cashOut} label={'Cash-out'} />
            <LegendEntry
              IconElement={legend.transaction}
              label={'One transaction'}
            />
            <LegendEntry IconElement={legend.average} label={'Average'} />
          </Box>
        </div>
        <div className={classes.graphHeaderRight}>
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
        representing={representing}
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

export default OverTimeDotGraphHeader
