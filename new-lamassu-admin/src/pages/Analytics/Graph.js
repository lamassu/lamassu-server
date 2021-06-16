import * as d3 from 'd3'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  java,
  neon,
  subheaderDarkColor,
  offColor,
  fontColor,
  primaryColor,
  fontSecondary
} from 'src/styling/variables'

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
    const currentDateDay = currentDate.getDate()
    const currentDateWeekday = currentDate.getDay()
    const currentDateMonth = currentDate.getMonth()

    const previousDate = new Date(currentDate.getTime())
    previousDate.setDate(currentDateDay - 1)

    const previousDateDay = previousDate.getDate()
    const previousDateWeekday = previousDate.getDay()
    const previousDateMonth = previousDate.getMonth()

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]

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
      const now = Date.now()
      const points = []

      const roundDate = d => {
        const step = dataPoints[period.code].step
        return new Date(Math.ceil(d.getTime() / step) * step)
      }

      for (let i = 0; i <= dataPoints[period.code].freq; i++) {
        const stepDate = new Date(now - i * dataPoints[period.code].step)
        if (stepDate < domain[0]) continue
        points.push(roundDate(stepDate))
      }

      return points
    },
    [dataPoints, period]
  )

  const x = d3
    .scaleUtc()
    .domain(periodDomains[period.code])
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.amount) * 1.03])
    .nice()
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
            .ticks(dataPoints[period.code].tick)
            .tickFormat(d3.timeFormat(dataPoints[period.code].labelFormat))
        )
        .call(g => g.select('.domain').remove())
        .call(g =>
          g
            .append('line')
            .attr('x1', GRAPH_MARGIN.left)
            .attr('y1', -GRAPH_HEIGHT + GRAPH_MARGIN.top + GRAPH_MARGIN.bottom)
            .attr('x2', GRAPH_MARGIN.left)
            .attr('fill', primaryColor)
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
            .attr('fill', primaryColor)
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
        // Thick vertical lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(
              buildTicks(x.domain()).filter(x => {
                if (period.code === 'day') return x.getHours() === 0
                return x.getDate() === 1
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
            if (period.code === 'day') return x.getHours() === 0
            return x.getDate() === 1
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
            if (period.code === 'day') return x.getHours() === 0
            return x.getDate() === 1
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
    [GRAPH_MARGIN, buildTicks, getPastAndCurrentDayLabels, x, y, period]
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
        .attr('fill', primaryColor)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '10, 5')
        .call(g =>
          g
            .append('line')
            .attr('y1', 0.5 + y(d3.mean(data, d => d.amount)))
            .attr('y2', 0.5 + y(d3.mean(data, d => d.amount)))
            .attr('x1', GRAPH_MARGIN.left)
            .attr('x2', GRAPH_WIDTH - GRAPH_MARGIN.right)
        )
    },
    [GRAPH_MARGIN, y, data]
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
    svg
      .append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('stroke', d => (d.direction === 'cash-in' ? java : neon))
      .attr('cx', d => x(d.created))
      .attr('cy', d => y(d.amount))
      .attr('fill', d => (d.direction === 'cash-in' ? java : neon))
      .attr('r', 2.5)

    return svg.node()
  }, [
    buildAvg,
    buildGrid,
    buildXAxis,
    buildYAxis,
    data,
    formatText,
    formatTicks,
    formatTicksText,
    x,
    y
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
