import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'

import { Select, Switch } from 'src/components/inputs'
import { H2 } from 'src/components/typography'
import { neon, java } from 'src/styling/variables'

import styles from '../../Analytics.styles'
import Graph from '../../graphs/Graph'
import LegendEntry from '../LegendEntry'

const useStyles = makeStyles(styles)

const VolumeOverTimeGraphHeader = ({
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

  const [logarithmic, setLogarithmic] = useState()

  const legend = {
    cashIn: (
      <svg height="12" width="18">
        <path
          stroke={java}
          strokeWidth="3"
          d="M 3 6 l 12 0"
          stroke-linecap="round"
        />
      </svg>
    ),
    cashOut: (
      <svg height="12" width="18">
        <path
          stroke={neon}
          strokeWidth="3"
          d="M 3 6 l 12 0"
          stroke-linecap="round"
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
          </Box>
        </div>
        <div className={classes.graphHeaderRight}>
          <div className={classes.graphHeaderSwitchBox}>
            <span>Log. scale</span>
            <Switch onChange={event => setLogarithmic(event.target.checked)} />
          </div>
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
        log={logarithmic}
      />
    </>
  )
}

export default VolumeOverTimeGraphHeader
