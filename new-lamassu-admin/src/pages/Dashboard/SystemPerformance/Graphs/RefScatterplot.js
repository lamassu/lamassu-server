import * as d3 from 'd3'
import moment from 'moment'
import * as R from 'ramda'
import React, { useEffect, useRef, useCallback } from 'react'
import { backgroundColor, java, neon } from 'src/styling/variables'

const RefScatterplot = ({ data: realData, timeFrame }) => {
  const svgRef = useRef()
  const cashIns = R.filter(R.propEq('txClass', 'cashIn'))(realData)
  const cashOuts = R.filter(R.propEq('txClass', 'cashOut'))(realData)
  const drawGraph = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const margin = { top: 25, right: 0, bottom: 25, left: 15 }
    const width = 555 - margin.left - margin.right
    const height = 150 - margin.top - margin.bottom

    // finds maximum value for the Y axis. Minimum value is 100. If value is multiple of 1000, add 100
    // (this is because the Y axis looks best with multiples of 100)
    const findMaxY = () => {
      if (realData.length === 0) return 100
      const maxvalueTx =
        100 * Math.ceil(d3.max(realData, t => parseFloat(t.fiat)) / 100)
      const maxY = Math.max(100, maxvalueTx)
      if (maxY % 1000 === 0) return maxY + 100
      return maxY
    }

    // changes values of arguments in some d3 function calls to make the graph labels look good according to the selected time frame
    const findXAxisSettings = () => {
      // case 'Day' or default
      const res = {
        nice: null,
        ticks: 4,
        subtractDays: 1,
        timeFormat: '%H:%M',
        timeRange: [50, 500]
      }
      switch (timeFrame) {
        case 'Week':
          return {
            nice: 7,
            ticks: 7,
            subtractDays: 7,
            timeFormat: '%a %d',
            timeRange: [50, 500]
          }
        case 'Month':
          return {
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

    // sets width of the graph
    svg.attr('width', width)

    // background color for the graph
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', -margin.top)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top)
      .attr('fill', backgroundColor)
      .attr('transform', `translate(${0},${margin.top})`)

    // declare g variable where more svg components will be attached
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // y axis range: round up to 100 highest data value, if rounds up to 1000, add 100.
    // this keeps the vertical axis nice looking
    const maxY = findMaxY()
    const xAxisSettings = findXAxisSettings()

    // y and x scales
    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, maxY])
      .nice(3)
    const x = d3
      .scaleTime()
      .domain([
        moment()
          .add(-xAxisSettings.subtractDays, 'day')
          .valueOf(),
        moment().valueOf()
      ])
      .range(xAxisSettings.timeRange)
      .nice(xAxisSettings.nice)

    // horizontal gridlines
    const makeYGridlines = () => {
      return d3.axisLeft(y).ticks(4)
    }
    g.append('g')
      .style('color', '#eef1ff')
      .call(
        makeYGridlines()
          .tickSize(-width)
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())

    /* X AXIS */
    // this one is for the labels at the bottom
    g.append('g')
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
      )
      .selectAll('text')
      .attr('dy', '1.5em')
    // this is for the x axis line. It is the same color as the horizontal grid lines
    g.append('g')
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
      .attr('dy', '1.5em')
    /* ******************** */

    // Y axis
    g.append('g')
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
      .attr('transform', 'translate(' + margin.left + ',' + 15 + ')')
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
      .attr('transform', 'translate(' + margin.left + ',' + 15 + ')')
      .style('fill', neon)

    /* ************************** */
  }, [cashIns, cashOuts, realData, timeFrame])

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
