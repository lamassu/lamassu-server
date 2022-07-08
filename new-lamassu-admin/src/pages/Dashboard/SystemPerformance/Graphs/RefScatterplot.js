import BigNumber from 'bignumber.js'
import * as d3 from 'd3'
import { getTimezoneOffset } from 'date-fns-tz'
import { add, format, startOfWeek, startOfYear } from 'date-fns/fp'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  java,
  neon,
  subheaderDarkColor,
  offColor,
  fontSecondary,
  backgroundColor
} from 'src/styling/variables'
import { MINUTE, DAY, WEEK, MONTH } from 'src/utils/time'

const Graph = ({ data, timeFrame, timezone }) => {
  const ref = useRef(null)

  const GRAPH_HEIGHT = 250
  const GRAPH_WIDTH = 555
  const GRAPH_MARGIN = useMemo(
    () => ({
      top: 20,
      right: 3.5,
      bottom: 27,
      left: 33.5
    }),
    []
  )

  const offset = getTimezoneOffset(timezone)
  const NOW = Date.now() + offset

  const periodDomains = {
    Day: [NOW - DAY, NOW],
    Week: [NOW - WEEK, NOW],
    Month: [NOW - MONTH, NOW]
  }

  const dataPoints = useMemo(
    () => ({
      Day: {
        freq: 24,
        step: 60 * 60 * 1000,
        tick: d3.utcHour.every(4),
        labelFormat: '%H:%M'
      },
      Week: {
        freq: 7,
        step: 24 * 60 * 60 * 1000,
        tick: d3.utcDay.every(1),
        labelFormat: '%a %d'
      },
      Month: {
        freq: 30,
        step: 24 * 60 * 60 * 1000,
        tick: d3.utcDay.every(2),
        labelFormat: '%d'
      }
    }),
    []
  )

  const filterDay = useCallback(
    x => (timeFrame === 'Day' ? x.getUTCHours() === 0 : x.getUTCDate() === 1),
    [timeFrame]
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
        const step = dataPoints[timeFrame].step
        return new Date(Math.ceil(d.valueOf() / step) * step)
      }

      for (let i = 0; i <= dataPoints[timeFrame].freq; i++) {
        const stepDate = new Date(NOW - i * dataPoints[timeFrame].step)
        if (roundDate(stepDate) > domain[1]) continue
        if (stepDate < domain[0]) continue
        points.push(roundDate(stepDate))
      }

      return points
    },
    [NOW, dataPoints, timeFrame]
  )

  const x = d3
    .scaleUtc()
    .domain(periodDomains[timeFrame])
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])

  const y = d3
    .scaleLinear()
    .domain([
      0,
      (d3.max(data, d => new BigNumber(d.fiat).toNumber()) ?? 1000) * 1.05
    ])
    .nice()
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const buildBackground = useCallback(
    g => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', GRAPH_MARGIN.top)
        .attr('width', GRAPH_WIDTH)
        .attr('height', GRAPH_HEIGHT - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom)
        .attr('fill', backgroundColor)
    },
    [GRAPH_MARGIN]
  )

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
            .ticks(dataPoints[timeFrame].tick)
            .tickFormat(d => {
              return d3.timeFormat(dataPoints[timeFrame].labelFormat)(
                d.getTime() + d.getTimezoneOffset() * MINUTE
              )
            })
        )
        .call(g => g.select('.domain').remove()),
    [GRAPH_MARGIN, dataPoints, timeFrame, x]
  )

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5))
        .call(g => g.select('.domain').remove())
        .selectAll('text')
        .attr('dy', '-0.25rem'),
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
            .attr('stroke-width', 1)
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
                .ticks(5)
            )
            .join('line')
            .attr('y1', d => 0.5 + y(d))
            .attr('y2', d => 0.5 + y(d))
            .attr('x1', GRAPH_MARGIN.left)
            .attr('x2', GRAPH_WIDTH)
        )
        // Thick vertical lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(buildTicks(x.domain()).filter(filterDay))
            .join('line')
            .attr('class', 'dateSeparator')
            .attr('x1', d => 0.5 + x(d))
            .attr('x2', d => 0.5 + x(d))
            .attr('y1', GRAPH_MARGIN.top - 10)
            .attr('y2', GRAPH_HEIGHT - GRAPH_MARGIN.bottom)
            .attr('stroke-width', 2)
            .join('text')
        )
        // Left side breakpoint label
        .call(g => {
          const separator = d3
            ?.select('.dateSeparator')
            ?.node()
            ?.getBBox()

          if (!separator) return

          const breakpoint = buildTicks(x.domain()).filter(filterDay)

          const labels = getPastAndCurrentDayLabels(breakpoint)

          return g
            .append('text')
            .attr('x', separator.x - 7)
            .attr('y', separator.y)
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

          const breakpoint = buildTicks(x.domain()).filter(filterDay)

          const labels = getPastAndCurrentDayLabels(breakpoint)

          return g
            .append('text')
            .attr('x', separator.x + 7)
            .attr('y', separator.y)
            .attr('text-anchor', 'start')
            .attr('dy', '.25em')
            .text(labels.current)
        })
    },
    [GRAPH_MARGIN, buildTicks, getPastAndCurrentDayLabels, x, y, filterDay]
  )

  const formatTicksText = useCallback(
    () =>
      d3
        .selectAll('.tick text')
        .style('stroke', offColor)
        .style('fill', offColor)
        .style('stroke-width', 0)
        .style('font-family', fontSecondary),
    []
  )

  const formatText = useCallback(
    () =>
      d3
        .selectAll('text')
        .style('stroke', offColor)
        .style('fill', offColor)
        .style('stroke-width', 0)
        .style('font-family', fontSecondary),
    []
  )

  const formatTicks = useCallback(() => {
    d3.selectAll('.tick line')
      .style('stroke', 'transparent')
      .style('fill', 'transparent')
  }, [])

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

    svg.append('g').call(buildBackground)
    svg.append('g').call(buildGrid)
    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildYAxis)
    svg.append('g').call(formatTicksText)
    svg.append('g').call(formatText)
    svg.append('g').call(formatTicks)
    svg.append('g').call(drawData)

    return svg.node()
  }, [
    buildBackground,
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

export default Graph
