/* eslint-disable */

import * as d3 from 'd3'
import React, { useEffect, useRef } from 'react'
import moment from 'moment'
import { backgroundColor, java, neon } from 'src/styling/variables'
import * as R from 'ramda'

const RefScatterplot = ({ data: realData, timeFrame }) => {
  const svgRef = useRef()

  realData = [
    ...realData,
    {
      created: new Date('2020-11-05T12:00:00.000Z'),
      fiat: 0,
      txClass: 'cashOut'
    }
  ]

  const cashIns = R.filter(R.propEq('txClass', 'cashIn'))(realData)
  const cashOuts = R.filter(R.propEq('txClass', 'cashOut'))(realData)

  const findMaxY = () => {
    let maxY = Object.keys(realData).reduce(
      (acc, curr) =>
        acc.fiat
          ? realData[curr].fiat > acc.fiat
            ? realData[curr]
            : acc
          : realData[curr],
      {}
    ).fiat

    maxY = 100 * Math.ceil(maxY / 100)

    if (maxY < 100) {
      return 100
    } else if (maxY % 1000 === 0) {
      return maxY + 100
    }
    return maxY
  }

  const findXRange = () => {
    let min = +Infinity
    let max = -Infinity
    realData.forEach(t => {
      let timestamp = +new Date(t.created)
      if (timestamp >= max) {
        max = timestamp
      }
      if (timestamp <= min) {
        min = timestamp
      }
    })
    return [min, max]
  }

  const findXAxisSettings = () => {
    let res = {
      nice: null,
      ticks: 4,
      subtractDays: 1,
      timeFormat: '%H:%M',
      timeRange: [0, 500]
    }
    switch (timeFrame) {
      case 'Day':
        return res
      case 'Week':
        return {
          ...res,
          nice: 7,
          ticks: 7,
          subtractDays: 7,
          timeFormat: '%d',
          timeRange: [50, 500]
        }
      case 'Month':
        return {
          ...res,
          nice: 6,
          ticks: 6,
          subtractDays: 30,
          timeFormat: '%b %d',
          timeRange: [50, 500]
        }
      default:
        return res
    }
  }

  const drawGraph = () => {
    const svg = d3.select(svgRef.current)
    const margin = { top: 25, right: 0, bottom: 25, left: 0 }
    const width = 540 - margin.left - margin.right
    const height = 150 - margin.top - margin.bottom

    svg.attr('width', width)

    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', -margin.top)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top)
      .attr('fill', backgroundColor)
      .attr('transform', `translate(${0},${margin.top})`)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // y axis range: round up to 100 highest data value, if rounds up to 1000, add 100.
    // this keeps the vertical axis nice looking
    const maxY = findMaxY()
    const xAxisSettings = findXAxisSettings()

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, maxY])
      .nice(3)
    const x = d3
      .scaleTime()
      .domain([
        moment()
          .endOf('day')
          .add(-xAxisSettings.subtractDays, 'day')
          .valueOf(),
        moment()
          .endOf('day')
          .valueOf()
      ])
      .range(xAxisSettings.timeRange)
      .nice(xAxisSettings.nice)

    const make_y_gridlines = () => {
      return d3.axisLeft(y).ticks(4)
    }

    g.append('g')
      .attr('class', `grid`)
      .attr('transform', 'translate(0,' + height + ')')

    g.append('g')
      .attr('class', `grid`)
      .style('color', '#eef1ff')
      .call(
        make_y_gridlines()
          .tickSize(-width)
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())

    /* X AXIS */
    g.append('g')
      .attr('class', `axis axis--x`)
      .attr('transform', 'translate(0,' + height + ')')
      .style('font-size', '13px')
      .style('color', '#5f668a')
      .style('font-family', 'MuseoSans')
      .style('margin-top', '11px')
      .call(
        d3
          .axisBottom(x)
          .ticks(xAxisSettings.ticks)
          .tickSize(0)
          .tickFormat(d3.timeFormat(xAxisSettings.timeFormat))
        // .tickFormat(d3.timeFormat('%H:%M'))
      )
      .selectAll('text')
      //.attr('dx', '4em')
      .attr('dy', '1.5em')

    g.append('g')
      .attr('class', `axis axis--x`)
      .attr('transform', 'translate(0,' + height + ')')
      .style('color', '#eef1ff')
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickSize(0)
          .tickFormat('')
      )
      .selectAll('text')
      //.attr('dx', '4em')
      .attr('dy', '1.5em')
    /* ******************** */

    g.append('g')
      .attr('class', 'axis axis--y')
      .style('font-size', '13px')
      .style('color', '#5f668a')
      .style('font-family', 'MuseoSans')
      .style('margin-top', '11px')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(0)
      )
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '-0.40em')
      .attr('dx', '3em')

    /* APPEND DOTS */
    svg
      .append('g')
      .selectAll('dot')
      .data(cashIns)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x(new Date(d.created))
      })
      .attr('cy', function(d) {
        return y(d.fiat)
      })
      .attr('r', 4)
      .attr('transform', 'translate(' + 0 + ',' + 15 + ')')
      .style('fill', java)
    svg
      .append('g')
      .selectAll('dot')
      .data(cashOuts)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x(new Date(d.created))
      })
      .attr('cy', function(d) {
        return y(d.fiat)
      })
      .attr('r', 4)
      .attr('transform', 'translate(' + 0 + ',' + 15 + ')')
      .style('fill', neon)

    /* ************************** */
  }

  useEffect(() => {
    // first we clear old chart DOM elements on component update
    d3.select(svgRef.current)
      .selectAll('*')
      .remove()
    drawGraph()
  }, [drawGraph])

  return (
    <>
      <svg ref={svgRef} />
    </>
  )
}
export default RefScatterplot
