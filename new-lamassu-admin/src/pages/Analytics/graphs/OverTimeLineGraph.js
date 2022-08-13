import BigNumber from 'bignumber.js'
import * as d3 from 'd3'
import { getTimezoneOffset } from 'date-fns-tz'
import {
  add,
  addMilliseconds,
  compareDesc,
  differenceInMilliseconds,
  format,
  startOfWeek,
  startOfYear
} from 'date-fns/fp'
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
  setSelectionDateInterval,
  log = false
}) => {
  const ref = useRef(null)

  const GRAPH_POPOVER_WIDTH = 150
  const GRAPH_POPOVER_MARGIN = 25
  const GRAPH_HEIGHT = 401
  const GRAPH_WIDTH = 1163
  const GRAPH_MARGIN = useMemo(
    () => ({
      top: 25,
      right: 3.5,
      bottom: 27,
      left: 36.5
    }),
    []
  )

  const offset = getTimezoneOffset(timezone)
  const NOW = Date.now() + offset

  const periodDomains = {
    day: [NOW - DAY, NOW],
    threeDays: [NOW - 3 * DAY, NOW],
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
      threeDays: {
        freq: 12,
        step: 6 * 60 * 60 * 1000,
        tick: d3.utcDay.every(1),
        labelFormat: '%a %d'
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

    const daysOfWeek = Array.from(Array(7)).map((_, i) =>
      format('EEE', add({ days: i }, startOfWeek(new Date())))
    )

    const months = Array.from(Array(12)).map((_, i) =>
      format('LLL', add({ months: i }, startOfYear(new Date())))
    )

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

  // Create a second X axis for mouseover events to be placed correctly across the entire graph width and not limited by X's domain
  const x2 = d3
    .scaleUtc()
    .domain(periodDomains[period.code])
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH])

  const bins = buildAreas(x.domain())
    .sort((a, b) => compareDesc(a.date, b.date))
    .map(addMilliseconds(-dataPoints[period.code].step))
    .map((date, i, dates) => {
      // move first and last bin in such way
      // that all bin have uniform width
      if (i === 0)
        return addMilliseconds(dataPoints[period.code].step, dates[1])
      else if (i === dates.length - 1)
        return addMilliseconds(
          -dataPoints[period.code].step,
          dates[dates.length - 2]
        )
      else return date
    })
    .map(date => {
      const middleOfBin = addMilliseconds(
        dataPoints[period.code].step / 2,
        date
      )

      const txs = data.filter(tx => {
        const txCreated = new Date(tx.created)
        const shift = new Date(txCreated.getTime() + offset)

        return (
          Math.abs(differenceInMilliseconds(shift, middleOfBin)) <
          dataPoints[period.code].step / 2
        )
      })

      const cashIn = txs
        .filter(tx => tx.txClass === 'cashIn')
        .reduce((sum, tx) => sum + new BigNumber(tx.fiat).toNumber(), 0)

      const cashOut = txs
        .filter(tx => tx.txClass === 'cashOut')
        .reduce((sum, tx) => sum + new BigNumber(tx.fiat).toNumber(), 0)

      return { date: middleOfBin, cashIn, cashOut }
    })

  const min = d3.min(bins, d => Math.min(d.cashIn, d.cashOut)) ?? 0
  const max = d3.max(bins, d => Math.max(d.cashIn, d.cashOut)) ?? 1000

  const yLin = d3
    .scaleLinear()
    .domain([0, (max === min ? min + 1000 : max) * 1.03])
    .nice()
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const yLog = d3
    .scaleLog()
    .domain([
      min === 0 ? 1 : min * 0.9,
      (max === min ? min + Math.pow(10, 2 * min + 1) : max) * 2
    ])
    .clamp(true)
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const y = log ? yLog : yLin

  const getAreaInterval = (breakpoints, dataLimits, graphLimits) => {
    const fullBreakpoints = [
      graphLimits[1],
      ...R.filter(it => it > dataLimits[0] && it < dataLimits[1], breakpoints),
      dataLimits[0]
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
            .tickSizeOuter(0)
        )
        .call(g =>
          g
            .select('.domain')
            .attr('stroke', primaryColor)
            .attr('stroke-width', 1)
        ),
    [GRAPH_MARGIN, dataPoints, period.code, x]
  )

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(
          d3
            .axisLeft(y)
            .ticks(GRAPH_HEIGHT / 100)
            .tickSizeOuter(0)
            .tickFormat(d => {
              if (log && !['1', '2', '5'].includes(d.toString()[0])) return ''

              if (d > 999) return Math.floor(d / 1000) + 'k'
              else return d
            })
        )
        .select('.domain')
        .attr('stroke', primaryColor)
        .attr('stroke-width', 1),
    [GRAPH_MARGIN, y, log]
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
            .attr('x2', GRAPH_WIDTH)
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
                x.range(),
                x2.range()
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
                x.range(),
                x2.range()
              )

              const dateInterval = getDateIntervalByX(areas, intervals, xValue)
              if (!dateInterval) return
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
      x2,
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

  const drawData = useCallback(
    g => {
      g.append('clipPath')
        .attr('id', 'clip-path')
        .append('rect')
        .attr('x', GRAPH_MARGIN.left)
        .attr('y', GRAPH_MARGIN.top)
        .attr('width', GRAPH_WIDTH)
        .attr('height', GRAPH_HEIGHT - GRAPH_MARGIN.bottom - GRAPH_MARGIN.top)
        .attr('fill', java)

      g.append('g')
        .attr('clip-path', 'url(#clip-path)')
        .selectAll('circle .cashIn')
        .data(bins)
        .join('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.cashIn))
        .attr('fill', java)
        .attr('r', 3.5)

      g.append('g')
        .attr('clip-path', 'url(#clip-path)')
        .selectAll('circle .cashIn')
        .data(bins)
        .join('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.cashOut))
        .attr('fill', neon)
        .attr('r', 3.5)

      g.append('path')
        .datum(bins)
        .attr('fill', 'none')
        .attr('stroke', java)
        .attr('stroke-width', 3)
        .attr('clip-path', 'url(#clip-path)')
        .attr(
          'd',
          d3
            .line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.date))
            .y(d => y(d.cashIn))
        )

      g.append('path')
        .datum(bins)
        .attr('fill', 'none')
        .attr('stroke', neon)
        .attr('stroke-width', 3)
        .attr('clip-path', 'url(#clip-path)')
        .attr(
          'd',
          d3
            .line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.date))
            .y(d => y(d.cashOut))
        )
    },
    [x, y, bins, GRAPH_MARGIN]
  )

  const drawChart = useCallback(() => {
    const svg = d3
      .select(ref.current)
      .attr('viewBox', [0, 0, GRAPH_WIDTH, GRAPH_HEIGHT])

    svg.append('g').call(buildGrid)
    svg.append('g').call(drawData)
    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildYAxis)
    svg.append('g').call(formatTicksText)
    svg.append('g').call(formatText)
    svg.append('g').call(formatTicks)

    return svg.node()
  }, [
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
    R.equals(prev.selectedMachine, next.selectedMachine) &&
    R.equals(prev.log, next.log)
)
