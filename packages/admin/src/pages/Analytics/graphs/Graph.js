import * as R from 'ramda'
import React, { memo, useState } from 'react'

import GraphTooltip from '../components/tooltips/GraphTooltip'

import HourOfDayBarGraph from './HourOfDayBarGraph'
import OverTimeDotGraph from './OverTimeDotGraph'
import TopMachinesBarGraph from './TopMachinesBarGraph'

const GraphWrapper = ({
  data,
  representing,
  period,
  timezone,
  currency,
  selectedMachine,
  machines,
  selectedDay
}) => {
  const [selectionCoords, setSelectionCoords] = useState(null)
  const [selectionDateInterval, setSelectionDateInterval] = useState(null)
  const [selectionData, setSelectionData] = useState(null)

  const getGraph = representing => {
    switch (representing.code) {
      case 'overTime':
        return (
          <OverTimeDotGraph
            data={data}
            period={period}
            timezone={timezone}
            setSelectionCoords={setSelectionCoords}
            setSelectionDateInterval={setSelectionDateInterval}
            setSelectionData={setSelectionData}
            selectedMachine={selectedMachine}
          />
        )
      case 'topMachinesVolume':
        return (
          <TopMachinesBarGraph
            data={data}
            period={period}
            timezone={timezone}
            setSelectionCoords={setSelectionCoords}
            setSelectionDateInterval={setSelectionDateInterval}
            setSelectionData={setSelectionData}
            selectedMachine={selectedMachine}
            machines={R.filter(it => it.code !== 'all', machines)}
            currency={currency}
          />
        )
      case 'topMachinesTransactions':
        return (
          <TopMachinesBarGraph
            data={data}
            period={period}
            timezone={timezone}
            setSelectionCoords={setSelectionCoords}
            setSelectionDateInterval={setSelectionDateInterval}
            setSelectionData={setSelectionData}
            selectedMachine={selectedMachine}
            machines={R.filter(it => it.code !== 'all', machines)}
            currency={currency}
          />
        )
      case 'hourOfDayVolume':
        return (
          <HourOfDayBarGraph
            data={data}
            period={period}
            timezone={timezone}
            setSelectionCoords={setSelectionCoords}
            setSelectionDateInterval={setSelectionDateInterval}
            setSelectionData={setSelectionData}
            selectedMachine={selectedMachine}
            machines={R.filter(it => it.code !== 'all', machines)}
            currency={currency}
            selectedDay={selectedDay}
          />
        )
      case 'hourOfDayTransactions':
        return (
          <HourOfDayBarGraph
            data={data}
            period={period}
            timezone={timezone}
            setSelectionCoords={setSelectionCoords}
            setSelectionDateInterval={setSelectionDateInterval}
            setSelectionData={setSelectionData}
            selectedMachine={selectedMachine}
            machines={R.filter(it => it.code !== 'all', machines)}
            currency={currency}
            selectedDay={selectedDay}
          />
        )
      default:
        throw new Error(`There's no graph to represent ${representing}`)
    }
  }

  return (
    <div>
      {!R.isNil(selectionCoords) && (
        <GraphTooltip
          coords={selectionCoords}
          dateInterval={selectionDateInterval}
          data={selectionData}
          period={period}
          currency={currency}
          timezone={timezone}
          representing={representing}
        />
      )}
      {getGraph(representing)}
    </div>
  )
}

export default memo(GraphWrapper)
