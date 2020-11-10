/* eslint-disable */

import * as d3 from 'd3'
import React, { useEffect, useRef } from 'react'
import moment from 'moment'
import { backgroundColor, spacer, primaryColor } from 'src/styling/variables'

const data = [
  [0, '2020-11-10T18:00:00.000Z'],
  [200, '2020-11-10T23:59:59.999Z']
]

const RefScatterplot = () => {
  const svgRef = useRef()

  const drawGraph = () => {
    const svg = d3.select(svgRef.current)
    const margin = { top: 25, right: 10, bottom: 25, left: 0 }
    const width = 540 - margin.left - margin.right
    const height = 150 - margin.top - margin.bottom

    svg.attr('width', width)

    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', -margin.top)
      .attr('width', width)
      .attr('height', height + margin.top)
      .attr('fill', backgroundColor)
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, 1000])
    const x = d3
      .scaleTime()
      .domain([
        moment()
          .endOf('day')
          .add(-24, 'hours')
          .valueOf(),
        moment()
          .endOf('day')
          .valueOf()
      ])
      .range([0, 500])
      .nice()

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
          .ticks(6)
          .tickSize(0)
          .tickFormat(d3.timeFormat('%H:%M'))
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
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(0)
      )
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '-0.6em')
      .attr('dx', '3em')

    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x(new Date(d[1]))
      })
      .attr('cy', function(d) {
        return y(d[0])
      })
      .attr('r', 4)
      .attr('transform', 'translate(' + 0 + ',' + 16 + ')')
      .style('fill', '#69b3a2')
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
