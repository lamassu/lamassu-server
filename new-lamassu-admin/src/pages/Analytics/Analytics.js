import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Select } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { H2, Info2, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import styles from './Analytics.styles'
import Graph from './Graph'

const useStyles = makeStyles(styles)

const REPRESENTING_OPTIONS = [{ code: 'overTime', display: 'Over time' }]
const PERIOD_OPTIONS = [
  { code: 'day', display: 'Last 24 hours' },
  { code: 'week', display: 'Last 7 days' },
  { code: 'month', display: 'Last 30 days' }
]

const createRandomTx = () => {
  const directions = ['cash-in', 'cash-out']
  const now = new Date(Date.now())
  const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  return {
    direction: directions[Math.floor(Math.random() * directions.length)],
    created: new Date(
      twoMonthsAgo.getTime() +
        Math.random() * (now.getTime() - twoMonthsAgo.getTime())
    ),
    amount: Math.random() * (1500 - 5) + 5
  }
}

const dummyData = R.times(createRandomTx, 1000)

const filteredData = {
  day: {
    current: dummyData.filter(
      d => d.created >= Date.now() - 24 * 60 * 60 * 1000
    ),
    previous: dummyData.filter(
      d =>
        d.created < Date.now() - 24 * 60 * 60 * 1000 &&
        d.created >= Date.now() - 2 * 24 * 60 * 60 * 1000
    )
  },
  week: {
    current: dummyData.filter(
      d => d.created.getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
    ),
    previous: dummyData.filter(
      d =>
        d.created.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 &&
        d.created.getTime() >= Date.now() - 2 * 7 * 24 * 60 * 60 * 1000
    )
  },
  month: {
    current: dummyData.filter(
      d => d.created.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000
    ),
    previous: dummyData.filter(
      d =>
        d.created.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000 &&
        d.created.getTime() >= Date.now() - 2 * 30 * 24 * 60 * 60 * 1000
    )
  }
}

const LegendEntry = ({ IconComponent, label }) => {
  const classes = useStyles()

  return (
    <span className={classes.legendEntry}>
      <IconComponent height={10} />
      <P>{label}</P>
    </span>
  )
}

const OverviewEntry = ({ label, value, oldValue, currency }) => {
  const classes = useStyles()

  const isCurrency = !!currency

  const _oldValue = !oldValue || R.equals(oldValue, 0) ? 1 : oldValue
  const growthRate = ((value - oldValue) * 100) / _oldValue

  const growthClasses = {
    [classes.growth]: R.gt(value, oldValue),
    [classes.decline]: R.gt(oldValue, value)
  }

  return (
    <div className={classes.overviewEntry}>
      <P noMargin>{label}</P>
      <Info2 noMargin className={classes.overviewFieldWrapper}>
        <span>
          {isCurrency
            ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
            : value}
        </span>
        {isCurrency && ' '}
        {isCurrency && currency}
      </Info2>
      <span className={classes.overviewGrowth}>
        <CloseIcon height={10} />
        <P noMargin className={classnames(growthClasses)}>
          {growthRate.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
        </P>
      </span>
    </div>
  )
}

const AnalyticsGraph = ({ title, representing, period }) => {
  const classes = useStyles()

  const MACHINE_OPTIONS = [{ code: 'all', display: 'All machines' }]
  const [machines, setMachines] = useState(MACHINE_OPTIONS[0])

  return (
    <>
      <div className={classes.graphHeaderWrapper}>
        <div className={classes.graphHeaderLeft}>
          <H2 noMargin>{title}</H2>
          <Box className={classes.graphLegend}>
            <LegendEntry IconComponent={CloseIcon} label={'Cash-in'} />
            <LegendEntry IconComponent={CloseIcon} label={'Cash-out'} />
            <LegendEntry IconComponent={CloseIcon} label={'One transaction'} />
            <LegendEntry IconComponent={CloseIcon} label={'Average'} />
          </Box>
        </div>
        <div className={classes.graphHeaderRight}>
          <Select
            label="Machines"
            onSelectedItemChange={setMachines}
            items={MACHINE_OPTIONS}
            default={MACHINE_OPTIONS[0]}
            selectedItem={machines}
          />
        </div>
      </div>
      <Graph
        representing={representing}
        period={period}
        data={filteredData[period.code].current}
      />
    </>
  )
}

const Analytics = () => {
  const classes = useStyles()

  const [representing, setRepresenting] = useState(REPRESENTING_OPTIONS[0])
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0])

  const txs = {
    current: filteredData[period.code].current.length,
    previous: filteredData[period.code].previous.length
  }

  const avgAmount = {
    current:
      R.sum(R.map(d => d.amount, filteredData[period.code].current)) /
      txs.current,
    previous:
      R.sum(R.map(d => d.amount, filteredData[period.code].previous)) /
      txs.previous
  }

  const txVolume = {
    current: R.sum(R.map(d => d.amount, filteredData[period.code].current)),
    previous: R.sum(R.map(d => d.amount, filteredData[period.code].previous))
  }

  const commissions = {
    current: 10,
    previous: 20
  }

  console.log('dummyData', dummyData)

  return (
    <>
      <TitleSection title="Analytics">
        <Box className={classes.overviewLegend}>
          <LegendEntry
            IconComponent={CloseIcon}
            label={'Up since last period'}
          />
          <LegendEntry
            IconComponent={CloseIcon}
            label={'Down since last period'}
          />
          <LegendEntry
            IconComponent={CloseIcon}
            label={'Same since last period'}
          />
        </Box>
      </TitleSection>
      <div className={classes.dropdownsOverviewWrapper}>
        <div className={classes.dropdowns}>
          <Select
            label="Representing"
            onSelectedItemChange={setRepresenting}
            items={REPRESENTING_OPTIONS}
            default={REPRESENTING_OPTIONS[0]}
            selectedItem={representing}
          />
          <Select
            label="Time period"
            onSelectedItemChange={setPeriod}
            items={PERIOD_OPTIONS}
            default={PERIOD_OPTIONS[0]}
            selectedItem={period}
          />
        </div>
        <div className={classes.overview}>
          <OverviewEntry
            label="Transactions"
            value={txs.current}
            oldValue={txs.previous}
          />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Avg. txn amount"
            value={avgAmount.current}
            oldValue={avgAmount.previous}
            currency="EUR"
          />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Volume"
            value={txVolume.current}
            oldValue={txVolume.previous}
            currency="EUR"
          />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Commissions"
            value={commissions.current}
            oldValue={commissions.previous}
            currency="EUR"
          />
        </div>
      </div>
      <AnalyticsGraph
        title="Transactions over time"
        representing={representing}
        period={period}
      />
    </>
  )
}

export default Analytics
