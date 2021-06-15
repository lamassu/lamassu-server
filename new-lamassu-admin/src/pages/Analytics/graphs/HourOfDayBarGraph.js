import BigNumber from 'bignumber.js'
import * as d3 from 'd3'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  java,
  neon,
  subheaderDarkColor,
  fontColor,
  fontSecondary,
  subheaderColor
} from 'src/styling/variables'
import { MINUTE } from 'src/utils/time'

const Graph = ({
  data,
  timezone,
  setSelectionCoords,
  setSelectionData,
  setSelectionDateInterval
}) => {
  const ref = useRef(null)

  const GRAPH_POPOVER_WIDTH = 150
  const GRAPH_POPOVER_MARGIN = 25
  const BAR_MARGIN = 10
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

  const offset = parseInt(timezone.split(':')[1]) * MINUTE

  const getTickIntervals = (domain, interval) => {
    const ticks = []
    const start = new Date(domain[0])
    const end = new Date(domain[1])

    const step = R.clone(start)

    // eslint-disable-next-line no-unmodified-loop-condition
    while (step <= end) {
      ticks.push(R.clone(step))
      step.setUTCHours(step.getUTCHours() + interval)
    }

    return ticks
  }

  const filterByHourInterval = useCallback(
    (lowerBound, upperBound) =>
      R.filter(it => {
        const tzCreated = new Date(it.created).setTime(
          new Date(it.created).getTime() +
            new Date(it.created).getTimezoneOffset() * MINUTE +
            offset
        )
        const created = new Date(tzCreated)

        return (
          (lowerBound.getUTCHours() < upperBound.getUTCHours() &&
            created.getUTCHours() >= new Date(lowerBound).getUTCHours() &&
            created.getUTCHours() < new Date(upperBound).getUTCHours()) ||
          (lowerBound.getUTCHours() > upperBound.getUTCHours() &&
            created.getUTCHours() <= new Date(lowerBound).getUTCHours() &&
            created.getUTCHours() < new Date(upperBound).getUTCHours())
        )
      }, data),
    [data, offset]
  )

  const txClassByHourInterval = useCallback(
    (lowerBound, upperBound) =>
      R.reduce(
        (acc, value) => {
          if (value.txClass === 'cashIn')
            acc.cashIn += BigNumber(value.fiat).toNumber()
          if (value.txClass === 'cashOut')
            acc.cashOut += BigNumber(value.fiat).toNumber()
          return acc
        },
        { cashIn: 0, cashOut: 0 },
        filterByHourInterval(lowerBound, upperBound)
      ),
    [filterByHourInterval]
  )

  const x = d3
    .scaleUtc()
    .domain([
      moment()
        .startOf('day')
        .utc(),
      moment()
        .startOf('day')
        .add(1, 'day')
        .utc()
    ])
    .rangeRound([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])

  const groupedByDateInterval = R.map(it => {
    const lowerBound = R.clone(it)
    it.setUTCHours(it.getUTCHours() + 2)
    const upperBound = R.clone(it)
    return [lowerBound, filterByHourInterval(lowerBound, upperBound)]
  }, R.init(getTickIntervals(x.domain(), 2)))

  const groupedByTxClass = R.map(it => {
    const lowerBound = R.clone(it)
    it.setUTCHours(it.getUTCHours() + 2)
    const upperBound = R.clone(it)
    return [lowerBound, txClassByHourInterval(lowerBound, upperBound)]
  }, R.init(getTickIntervals(x.domain(), 2)))

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        groupedByTxClass.map(it => it[1]),
        d => d.cashIn + d.cashOut
      ) !== 0
        ? d3.max(
            groupedByTxClass.map(it => it[1]),
            d => d.cashIn + d.cashOut
          )
        : 50
    ])
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const buildXAxis = useCallback(
    g =>
      g
        .attr(
          'transform',
          `translate(0, ${GRAPH_HEIGHT - GRAPH_MARGIN.bottom})`
        )
        .call(
          d3
            .axisBottom(x)
            .ticks(d3.timeHour.every(2))
            .tickFormat(d3.timeFormat('%H:%M'))
        ),
    [GRAPH_MARGIN, x]
  )

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(
          d3
            .axisLeft(y)
            .ticks(GRAPH_HEIGHT / 100)
            .tickSize(0)
            .tickFormat(``)
        )
        .call(g => g.select('.domain').remove()),
    [GRAPH_MARGIN, y]
  )

  const buildVerticalLines = useCallback(
    g =>
      g
        .attr('stroke', subheaderDarkColor)
        .append('g')
        .selectAll('line')
        .data(getTickIntervals(x.domain(), 2))
        .join('line')
        .attr('x1', d => {
          const xValue = x(d)
          const intervals = getTickIntervals(x.domain(), 2)
          return xValue === x(intervals[R.length(intervals) - 1])
            ? xValue - 1
            : 0.5 + xValue
        })
        .attr('x2', d => {
          const xValue = x(d)
          const intervals = getTickIntervals(x.domain(), 2)
          return xValue === x(intervals[R.length(intervals) - 1])
            ? xValue - 1
            : 0.5 + xValue
        })
        .attr('y1', GRAPH_MARGIN.top)
        .attr('y2', GRAPH_HEIGHT - GRAPH_MARGIN.bottom),
    [GRAPH_MARGIN, x]
  )

  const buildHoverableEventRects = useCallback(
    g =>
      g
        .append('g')
        .selectAll('line')
        .data(getTickIntervals(x.domain(), 2))
        .join('rect')
        .attr('x', d => x(d))
        .attr('y', GRAPH_MARGIN.top)
        .attr('width', d => {
          const xValue = Math.round(x(d) * 100) / 100
          const ticks = getTickIntervals(x.domain(), 2).map(it => x(it))

          const index = R.findIndex(it => it === xValue, ticks)
          const width =
            index + 1 === R.length(ticks) ? 0 : ticks[index + 1] - ticks[index]

          return Math.round(width * 100) / 100
        })
        .attr('height', GRAPH_HEIGHT - GRAPH_MARGIN.bottom - GRAPH_MARGIN.top)
        .attr('stroke', 'transparent')
        .attr('fill', 'transparent')
        .on('mouseover', d => {
          const date = R.clone(new Date(d.target.__data__))
          const startDate = R.clone(date)
          date.setUTCHours(date.getUTCHours() + 2)
          const endDate = R.clone(date)

          const filteredData = groupedByDateInterval.find(it =>
            R.equals(startDate, it[0])
          )[1]

          const rectXCoords = {
            left: R.clone(d.target.getBoundingClientRect().x),
            right: R.clone(
              d.target.getBoundingClientRect().x +
                d.target.getBoundingClientRect().width
            )
          }

          const xCoord =
            d.target.x.baseVal.value < 0.75 * GRAPH_WIDTH
              ? rectXCoords.right + GRAPH_POPOVER_MARGIN
              : rectXCoords.left - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN
          const yCoord = R.clone(d.target.getBoundingClientRect().y)

          setSelectionDateInterval([endDate, startDate])
          setSelectionData(filteredData)
          setSelectionCoords({
            x: Math.round(xCoord),
            y: Math.round(yCoord)
          })

          d3.select(`#event-rect-${x(d.target.__data__)}`).attr(
            'fill',
            subheaderColor
          )
        })
        .on('mouseleave', d => {
          d3.select(`#event-rect-${x(d.target.__data__)}`).attr(
            'fill',
            'transparent'
          )
          setSelectionDateInterval(null)
          setSelectionData(null)
          setSelectionCoords(null)
        }),
    [
      GRAPH_MARGIN,
      groupedByDateInterval,
      setSelectionCoords,
      setSelectionData,
      setSelectionDateInterval,
      x
    ]
  )

  const buildEventRects = useCallback(
    g =>
      g
        .append('g')
        .selectAll('line')
        .data(getTickIntervals(x.domain(), 2))
        .join('rect')
        .attr('id', d => `event-rect-${x(d)}`)
        .attr('x', d => x(d))
        .attr('y', GRAPH_MARGIN.top)
        .attr('width', d => {
          const xValue = Math.round(x(d) * 100) / 100
          const ticks = getTickIntervals(x.domain(), 2).map(it => x(it))

          const index = R.findIndex(it => it === xValue, ticks)
          const width =
            index + 1 === R.length(ticks) ? 0 : ticks[index + 1] - ticks[index]

          return Math.round(width * 100) / 100
        })
        .attr('height', GRAPH_HEIGHT - GRAPH_MARGIN.bottom - GRAPH_MARGIN.top)
        .attr('stroke', 'transparent')
        .attr('fill', 'transparent'),
    [GRAPH_MARGIN, x]
  )

  const formatTicksText = useCallback(
    () =>
      d3
        .selectAll('.tick text')
        .style('stroke', fontColor)
        .style('fill', fontColor)
        .style('stroke-width', 0.5)
        .style('font-family', fontSecondary),
    []
  )

  const drawCashIn = useCallback(
    g => {
      g.selectAll('rect')
        .data(R.init(getTickIntervals(x.domain(), 2)))
        .join('rect')
        .attr('stroke', java)
        .attr('fill', java)
        .attr('x', d => {
          return x(d) + BAR_MARGIN / 2
        })
        .attr('y', d => {
          const interval = R.find(it => R.equals(it[0], d), groupedByTxClass)
          return y(interval[1].cashIn) - GRAPH_MARGIN.top + GRAPH_MARGIN.bottom
        })
        .attr('height', d => {
          const interval = R.find(it => R.equals(it[0], d), groupedByTxClass)
          return R.clamp(
            0,
            GRAPH_HEIGHT,
            GRAPH_HEIGHT -
              y(interval[1].cashIn) -
              GRAPH_MARGIN.bottom -
              BAR_MARGIN / 2
          )
        })
        .attr('width', d => {
          const xValue = Math.round(x(d) * 100) / 100
          const ticks = getTickIntervals(x.domain(), 2).map(it => x(it))

          const index = R.findIndex(it => it === xValue, ticks)
          const width =
            index === R.length(ticks) ? 0 : ticks[index + 1] - ticks[index]
          return Math.round((width - BAR_MARGIN) * 100) / 100
        })
        .attr('rx', 2.5)
    },
    [x, y, GRAPH_MARGIN, groupedByTxClass]
  )

  const drawCashOut = useCallback(
    g => {
      g.selectAll('rect')
        .data(R.init(getTickIntervals(x.domain(), 2)))
        .join('rect')
        .attr('stroke', neon)
        .attr('fill', neon)
        .attr('x', d => {
          return x(d) + BAR_MARGIN / 2
        })
        .attr('y', d => {
          const interval = R.find(it => R.equals(it[0], d), groupedByTxClass)
          return (
            y(interval[1].cashIn + interval[1].cashOut) -
            GRAPH_MARGIN.top +
            GRAPH_MARGIN.bottom
          )
        })
        .attr('height', d => {
          const interval = R.find(it => R.equals(it[0], d), groupedByTxClass)
          return R.clamp(
            0,
            GRAPH_HEIGHT,
            GRAPH_HEIGHT -
              y(interval[1].cashOut) -
              GRAPH_MARGIN.bottom -
              BAR_MARGIN / 2
          )
        })
        .attr('width', d => {
          const xValue = Math.round(x(d) * 100) / 100
          const ticks = getTickIntervals(x.domain(), 2).map(it => x(it))

          const index = R.findIndex(it => it === xValue, ticks)
          const width =
            index === R.length(ticks) ? 0 : ticks[index + 1] - ticks[index]
          return Math.round((width - BAR_MARGIN) * 100) / 100
        })
        .attr('rx', 2.5)
    },
    [x, y, GRAPH_MARGIN, groupedByTxClass]
  )

  const drawChart = useCallback(() => {
    const svg = d3
      .select(ref.current)
      .attr('viewBox', [0, 0, GRAPH_WIDTH, GRAPH_HEIGHT])

    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildYAxis)
    svg.append('g').call(buildVerticalLines)
    svg.append('g').call(buildEventRects)
    svg.append('g').call(formatTicksText)
    svg.append('g').call(drawCashIn)
    svg.append('g').call(drawCashOut)
    svg.append('g').call(buildHoverableEventRects)

    return svg.node()
  }, [
    buildXAxis,
    buildYAxis,
    buildEventRects,
    buildHoverableEventRects,
    buildVerticalLines,
    drawCashIn,
    formatTicksText,
    drawCashOut
  ])

  useEffect(() => {
    d3.select(ref.current)
      .selectAll('*')
      .remove()
    drawChart()
  }, [drawChart])

  return <svg ref={ref} />
}

export default memo(
  Graph,
  (prev, next) =>
    R.equals(prev.period, next.period) &&
    R.equals(prev.selectedDay, next.selectedDay)
)
