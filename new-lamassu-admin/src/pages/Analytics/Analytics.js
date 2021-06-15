import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import * as d3 from 'd3'
import * as R from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Select } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { H2, Info2, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import styles from './Analytics.styles'

const useStyles = makeStyles(styles)

const REPRESENTING_OPTIONS = [{ code: 'overTime', display: 'Over time' }]
const PERIOD_OPTIONS = [
  { code: 'day', display: 'Last 24 hours' },
  { code: 'week', display: 'Last 7 days' },
  { code: 'month', display: 'Last 30 days' }
]

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
          {growthRate}%
        </P>
      </span>
    </div>
  )
}

const Graph = ({ data, representing, period }) => {
  const ref = useRef(null)

  const GRAPH_HEIGHT = 401
  const GRAPH_WIDTH = 1163
  const GRAPH_MARGIN = useMemo(
    () => ({
      top: 25,
      right: 0.5,
      bottom: 27,
      left: 36.5
    }),
    []
  )

  const periodDomains = {
    day: [Date.now() - 24 * 60 * 60 * 1000, Date.now()],
    week: [Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now()],
    month: [Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now()]
  }

  const x = d3
    .scaleUtc()
    .domain(periodDomains[period.code])
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])

  const y = d3
    .scaleLinear()
    .domain([0, 1000])
    .nice()
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const z = useCallback(() => {
    const max = d3.max(data, d => Math.abs(d.amount))
    return d3.scaleSequential(d3.interpolateRdBu).domain([max, -max])
  }, [data])

  const buildXAxis = useCallback(
    g =>
      g
        .attr(
          'transform',
          `translate(0, ${GRAPH_HEIGHT - GRAPH_MARGIN.bottom})`
        )
        .call(d3.axisBottom(x).ticks(GRAPH_WIDTH / 80))
        .call(g => g.select('.domain').remove()),
    [GRAPH_MARGIN, x]
  )

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(d3.axisLeft(y).ticks(4))
        .call(g => g.select('.domain').remove())
        .call(g =>
          g
            .selectAll('.tick line')
            .filter(d => d === 0)
            .clone()
            .attr('x2', GRAPH_WIDTH - GRAPH_MARGIN.right - GRAPH_MARGIN.left)
            .attr('stroke', '#5F668A')
        )
        .call(g =>
          g
            .append('text')
            .attr('fill', '#5F668A')
            .attr('x', 5)
            .attr('y', GRAPH_MARGIN.top)
            .attr('dy', '0.32em')
            .attr('text-anchor', 'start')
            .attr('font-weight', 'bold')
        ),
    [GRAPH_MARGIN, y]
  )

  const drawChart = useCallback(() => {
    const svg = d3
      .select(ref.current)
      .attr('viewBox', [0, 0, GRAPH_WIDTH, GRAPH_HEIGHT])

    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildYAxis)
    svg
      .append('g')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2)
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.amount))
      .attr('fill', d => z(d.amount))
      .attr('r', 2.5)

    return svg.node()
  }, [buildXAxis, buildYAxis, data, x, y, z])

  useEffect(() => {
    d3.select(ref.current)
      .selectAll('*')
      .remove()
    drawChart()
  }, [drawChart])

  return <svg ref={ref} />
}

const AnalyticsGraph = ({ title, representing, period }) => {
  const classes = useStyles()

  const MACHINE_OPTIONS = [{ code: 'all', display: 'All machines' }]
  const [machines, setMachines] = useState(MACHINE_OPTIONS[0])

  const data = [
    { direction: 'in', date: '2021-06-14', amount: 100 },
    { direction: 'in', date: '2021-06-14', amount: 200 },
    { direction: 'out', date: '2021-06-14', amount: 300 },
    { direction: 'out', date: '2021-06-14', amount: 400 },
    { direction: 'in', date: '2021-06-14', amount: 500 },
    { direction: 'in', date: '2021-06-14', amount: 600 }
  ]

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
      <Graph representing={representing} period={period} data={data} />
    </>
  )
}

const Analytics = () => {
  const classes = useStyles()

  const [representing, setRepresenting] = useState(REPRESENTING_OPTIONS[0])
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0])

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
          <OverviewEntry label="Transactions" value={1235} oldValue={0} />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Avg. txn amount"
            value={254}
            oldValue={0}
            currency="EUR"
          />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Volume"
            value={313690}
            oldValue={0}
            currency="EUR"
          />
          <div className={classes.verticalLine} />
          <OverviewEntry
            label="Commissions"
            value={25298}
            oldValue={0}
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
