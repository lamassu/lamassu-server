import BigNumber from 'bignumber.js'
import * as d3 from 'd3'
import moment from 'moment'
import * as R from 'ramda'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  java,
  neon,
  subheaderDarkColor,
  offColor,
  fontColor,
  primaryColor,
  fontSecondary,
  subheaderColor
} from 'src/styling/variables'
import { MINUTE, DAY, WEEK, MONTH } from 'src/utils/time'

const Graph = ({
  data,
  period,
  timezone,
  setSelectionCoords,
  setSelectionData,
  setSelectionDateInterval
}) => {
  const ref = useRef(null)

  const GRAPH_POPOVER_WIDTH = 150
  const GRAPH_POPOVER_MARGIN = 25
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
  const NOW = Date.now() + offset

  const periodDomains = {
    day: [NOW - DAY, NOW],
    week: [NOW - WEEK, NOW],
    month: [NOW - MONTH, NOW]
  }

  const dataPoints = useMemo(
    () => ({
      day: {
        freq: 24,
        step: 60 * 60 * 1000,
        tick: d3.utcHour.every(1),
        labelFormat: '%H:%M'
      },
      week: {
        freq: 7,
        step: 24 * 60 * 60 * 1000,
        tick: d3.utcDay.every(1),
        labelFormat: '%a %d'
      },
      month: {
        freq: 30,
        step: 24 * 60 * 60 * 1000,
        tick: d3.utcDay.every(1),
        labelFormat: '%d'
      }
    }),
    []
  )

  const getPastAndCurrentDayLabels = useCallback(d => {
    const currentDate = new Date(d)
    const currentDateDay = currentDate.getUTCDate()
    const currentDateWeekday = currentDate.getUTCDay()
    const currentDateMonth = currentDate.getUTCMonth()

    const previousDate = new Date(currentDate.getTime())
    previousDate.setUTCDate(currentDateDay - 1)

    const previousDateDay = previousDate.getUTCDate()
    const previousDateWeekday = previousDate.getUTCDay()
    const previousDateMonth = previousDate.getUTCMonth()

    const daysOfWeek = moment.weekdaysShort()
    const months = moment.monthsShort()

    return {
      previous:
        currentDateMonth !== previousDateMonth
          ? months[previousDateMonth]
          : `${daysOfWeek[previousDateWeekday]} ${previousDateDay}`,
      current:
        currentDateMonth !== previousDateMonth
          ? months[currentDateMonth]
          : `${daysOfWeek[currentDateWeekday]} ${currentDateDay}`
    }
  }, [])

  const buildTicks = useCallback(
    domain => {
      const points = []

      const roundDate = d => {
        const step = dataPoints[period.code].step
        return new Date(Math.ceil(d.valueOf() / step) * step)
      }

      for (let i = 0; i <= dataPoints[period.code].freq; i++) {
        const stepDate = new Date(NOW - i * dataPoints[period.code].step)
        if (roundDate(stepDate) > domain[1]) continue
        if (stepDate < domain[0]) continue
        points.push(roundDate(stepDate))
      }

      return points
    },
    [NOW, dataPoints, period.code]
  )

  const buildAreas = useCallback(
    domain => {
      const points = []

      points.push(domain[1])

      const roundDate = d => {
        const step = dataPoints[period.code].step
        return new Date(Math.ceil(d.valueOf() / step) * step)
      }

      for (let i = 0; i <= dataPoints[period.code].freq; i++) {
        const stepDate = new Date(NOW - i * dataPoints[period.code].step)
        if (roundDate(stepDate) > new Date(domain[1])) continue
        if (stepDate < new Date(domain[0])) continue
        points.push(roundDate(stepDate))
      }

      points.push(domain[0])

      return points
    },
    [NOW, dataPoints, period.code]
  )

  const x = d3
    .scaleUtc()
    .domain(periodDomains[period.code])
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])

  const y = d3
    .scaleLinear()
    .domain([
      0,
      (d3.max(data, d => new BigNumber(d.fiat).toNumber()) ?? 1000) * 1.03
    ])
    .nice()
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const getAreaInterval = (breakpoints, limits) => {
    const fullBreakpoints = [
      limits[1],
      ...R.filter(it => it > limits[0] && it < limits[1], breakpoints),
      limits[0]
    ]

    const intervals = []
    for (let i = 0; i < fullBreakpoints.length - 1; i++) {
      intervals.push([fullBreakpoints[i], fullBreakpoints[i + 1]])
    }

    return intervals
  }

  const getAreaIntervalByX = (intervals, xValue) => {
    return R.find(it => xValue <= it[0] && xValue >= it[1], intervals) ?? [0, 0]
  }

  const getDateIntervalByX = (areas, intervals, xValue) => {
    const flattenIntervals = R.uniq(R.flatten(intervals))

    // flattenIntervals and areas should have the same number of elements
    for (let i = intervals.length - 1; i >= 0; i--) {
      if (xValue < flattenIntervals[i]) {
        return [areas[i], areas[i + 1]]
      }
    }
  }

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
            .ticks(dataPoints[period.code].tick)
            .tickFormat(d => {
              return d3.timeFormat(dataPoints[period.code].labelFormat)(
                d.getTime() + d.getTimezoneOffset() * MINUTE
              )
            })
        )
        .call(g => g.select('.domain').remove())
        .call(g =>
          g
            .append('line')
            .attr('x1', GRAPH_MARGIN.left)
            .attr('y1', -GRAPH_HEIGHT + GRAPH_MARGIN.top + GRAPH_MARGIN.bottom)
            .attr('x2', GRAPH_MARGIN.left)
            .attr('stroke', primaryColor)
            .attr('stroke-width', 1)
        ),
    [GRAPH_MARGIN, dataPoints, period.code, x]
  )

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(d3.axisLeft(y).ticks(GRAPH_HEIGHT / 100))
        .call(g => g.select('.domain').remove())
        .call(g =>
          g
            .selectAll('.tick line')
            .filter(d => d === 0)
            .clone()
            .attr('x2', GRAPH_WIDTH - GRAPH_MARGIN.right - GRAPH_MARGIN.left)
            .attr('stroke-width', 1)
            .attr('stroke', primaryColor)
        ),
    [GRAPH_MARGIN, y]
  )

  const buildGrid = useCallback(
    g => {
      g.attr('stroke', subheaderDarkColor)
        .attr('fill', subheaderDarkColor)
        // Vertical lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(buildTicks(x.domain()))
            .join('line')
            .attr('x1', d => 0.5 + x(d))
            .attr('x2', d => 0.5 + x(d))
            .attr('y1', GRAPH_MARGIN.top)
            .attr('y2', GRAPH_HEIGHT - GRAPH_MARGIN.bottom)
        )
        // Horizontal lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(
              d3
                .axisLeft(y)
                .scale()
                .ticks(GRAPH_HEIGHT / 100)
            )
            .join('line')
            .attr('y1', d => 0.5 + y(d))
            .attr('y2', d => 0.5 + y(d))
            .attr('x1', GRAPH_MARGIN.left)
            .attr('x2', GRAPH_WIDTH - GRAPH_MARGIN.right)
        )
        // Vertical transparent rectangles for events
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(buildAreas(x.domain()))
            .join('rect')
            .attr('x', d => x(d))
            .attr('y', GRAPH_MARGIN.top)
            .attr('width', d => {
              const xValue = Math.round(x(d) * 100) / 100
              const intervals = getAreaInterval(
                buildAreas(x.domain()).map(it => Math.round(x(it) * 100) / 100),
                x.range()
              )
              const interval = getAreaIntervalByX(intervals, xValue)
              return Math.round((interval[0] - interval[1]) * 100) / 100
            })
            .attr(
              'height',
              GRAPH_HEIGHT - GRAPH_MARGIN.bottom - GRAPH_MARGIN.top
            )
            .attr('stroke', 'transparent')
            .attr('fill', 'transparent')
            .on('mouseover', d => {
              const xValue = Math.round(d.target.x.baseVal.value * 100) / 100
              const areas = buildAreas(x.domain())
              const intervals = getAreaInterval(
                buildAreas(x.domain()).map(it => Math.round(x(it) * 100) / 100),
                x.range()
              )

              const dateInterval = getDateIntervalByX(areas, intervals, xValue)
              const filteredData = data.filter(it => {
                const created = new Date(it.created)
                const tzCreated = created.setTime(created.getTime() + offset)
                return (
                  tzCreated > new Date(dateInterval[1]) &&
                  tzCreated <= new Date(dateInterval[0])
                )
              })

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
                  : rectXCoords.left -
                    GRAPH_POPOVER_WIDTH -
                    GRAPH_POPOVER_MARGIN
              const yCoord = R.clone(d.target.getBoundingClientRect().y)

              setSelectionDateInterval(dateInterval)
              setSelectionData(filteredData)
              setSelectionCoords({
                x: Math.round(xCoord),
                y: Math.round(yCoord)
              })

              d3.select(d.target).attr('fill', subheaderColor)
            })
            .on('mouseleave', d => {
              d3.select(d.target).attr('fill', 'transparent')
              setSelectionDateInterval(null)
              setSelectionData(null)
              setSelectionCoords(null)
            })
        )
        // Thick vertical lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(
              buildTicks(x.domain()).filter(x => {
                if (period.code === 'day') return x.getUTCHours() === 0
                return x.getUTCDate() === 1
              })
            )
            .join('line')
            .attr('class', 'dateSeparator')
            .attr('x1', d => 0.5 + x(d))
            .attr('x2', d => 0.5 + x(d))
            .attr('y1', GRAPH_MARGIN.top - 50)
            .attr('y2', GRAPH_HEIGHT - GRAPH_MARGIN.bottom)
            .attr('stroke-width', 5)
            .join('text')
        )
        // Left side breakpoint label
        .call(g => {
          const separator = d3
            ?.select('.dateSeparator')
            ?.node()
            ?.getBBox()

          if (!separator) return

          const breakpoint = buildTicks(x.domain()).filter(x => {
            if (period.code === 'day') return x.getUTCHours() === 0
            return x.getUTCDate() === 1
          })

          const labels = getPastAndCurrentDayLabels(breakpoint)

          return g
            .append('text')
            .attr('x', separator.x - 10)
            .attr('y', separator.y + 33)
            .attr('text-anchor', 'end')
            .attr('dy', '.25em')
            .text(labels.previous)
        })
        // Right side breakpoint label
        .call(g => {
          const separator = d3
            ?.select('.dateSeparator')
            ?.node()
            ?.getBBox()

          if (!separator) return

          const breakpoint = buildTicks(x.domain()).filter(x => {
            if (period.code === 'day') return x.getUTCHours() === 0
            return x.getUTCDate() === 1
          })

          const labels = getPastAndCurrentDayLabels(breakpoint)

          return g
            .append('text')
            .attr('x', separator.x + 10)
            .attr('y', separator.y + 33)
            .attr('text-anchor', 'start')
            .attr('dy', '.25em')
            .text(labels.current)
        })
    },
    [
      GRAPH_MARGIN,
      buildTicks,
      getPastAndCurrentDayLabels,
      x,
      y,
      period,
      buildAreas,
      data,
      offset,
      setSelectionCoords,
      setSelectionData,
      setSelectionDateInterval
    ]
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

  const formatText = useCallback(
    () =>
      d3
        .selectAll('text')
        .style('stroke', offColor)
        .style('fill', offColor)
        .style('stroke-width', 0.5)
        .style('font-family', fontSecondary),
    []
  )

  const formatTicks = useCallback(() => {
    d3.selectAll('.tick line')
      .style('stroke', primaryColor)
      .style('fill', primaryColor)
  }, [])

  const buildAvg = useCallback(
    g => {
      g.attr('stroke', primaryColor)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '10, 5')
        .call(g =>
          g
            .append('line')
            .attr(
              'y1',
              0.5 + y(d3.mean(data, d => new BigNumber(d.fiat).toNumber()) ?? 0)
            )
            .attr(
              'y2',
              0.5 + y(d3.mean(data, d => new BigNumber(d.fiat).toNumber()) ?? 0)
            )
            .attr('x1', GRAPH_MARGIN.left)
            .attr('x2', GRAPH_WIDTH - GRAPH_MARGIN.right)
        )
    },
    [GRAPH_MARGIN, y, data]
  )

  const drawData = useCallback(
    g => {
      g.selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', d => {
          const created = new Date(d.created)
          return x(created.setTime(created.getTime() + offset))
        })
        .attr('cy', d => y(new BigNumber(d.fiat).toNumber()))
        .attr('fill', d => (d.txClass === 'cashIn' ? java : neon))
        .attr('r', 3.5)
    },
    [data, offset, x, y]
  )

  const drawChart = useCallback(() => {
    const svg = d3
      .select(ref.current)
      .attr('viewBox', [0, 0, GRAPH_WIDTH, GRAPH_HEIGHT])

    svg.append('g').call(buildGrid)
    svg.append('g').call(buildAvg)
    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildYAxis)
    svg.append('g').call(formatTicksText)
    svg.append('g').call(formatText)
    svg.append('g').call(formatTicks)
    svg.append('g').call(drawData)

    return svg.node()
  }, [
    buildAvg,
    buildGrid,
    buildXAxis,
    buildYAxis,
    drawData,
    formatText,
    formatTicks,
    formatTicksText
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
    R.equals(prev.selectedMachine, next.selectedMachine)
)
