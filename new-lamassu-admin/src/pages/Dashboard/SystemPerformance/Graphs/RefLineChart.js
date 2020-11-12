/* eslint-disable */
import * as d3 from 'd3'
import moment from 'moment'
import * as R from 'ramda'
import React, { useEffect, useRef, useCallback } from 'react'

import { backgroundColor, zircon, primaryColor } from 'src/styling/variables'

const RefLineChart = ({ data: realData, timeFrame }) => {
  const svgRef = useRef()

  /*   realData = [
    ...realData,
    {
      created: new Date('2020-11-05T00:00:00.000Z'),
      fiat: 100,
      txClass: 'cashOut'
    }
  ] */

  const drawGraph = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const margin = { top: 0, right: 0, bottom: 0, left: 0 }
    const width = 336 - margin.left - margin.right
    const height = 128 - margin.top - margin.bottom

    const transactionProfit = tx => {
      let cashInFee = 0
      if (tx.cashInFee) {
        cashInFee = Number.parseFloat(tx.cashInFee)
      }
      const commission =
        Number.parseFloat(tx.commissionPercentage) * Number.parseFloat(tx.fiat)
      return commission + cashInFee
    }

    const findXAxisSettings = () => {
      const res = {
        nice: null,
        ticks: 4,
        subtractDays: 1,
        timeFormat: '%H:%M',
        // -25 because of the lack of y axis labels we need to push the line a few pixels left
        timeRange: [-25, 350]
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
            timeRange: [-25, 350]
          }
        case 'Month':
          return {
            ...res,
            nice: null,
            ticks: 6,
            subtractDays: 30,
            timeFormat: '%b %d',
            timeRange: [-25, 350]
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

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xRange = d3.extent(realData, t => t.created)
    const yRange = d3.extent(realData, transactionProfit)
    const xAxisSettings = findXAxisSettings()

    console.log(xRange, yRange)

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain(d3.extent(realData, transactionProfit))
      .nice(3)
    const x = d3
      .scaleTime()
      .domain([new Date(xRange[0]), new Date(xRange[1])])

      .range(xAxisSettings.timeRange)
      .nice(xAxisSettings.nice)

    const line = d3
      .line()
      .curve(d3.curveCatmullRom.alpha(0.5))
      .x(function(d) {
        return x(new Date(d.created))
      })
      .y(function(d) {
        return y(transactionProfit(d))
      })

    const area = d3
      .area()
      .x(function(d) {
        return x(new Date(d.created))
      })
      .y0(height)
      .y1(function(d) {
        return y(transactionProfit(d))
      })

    g.append('path')
      .datum(realData)
      .attr('d', line)
      .attr('stroke', primaryColor)
      .attr('stroke-width', '3')
      .style('fill', 'none')

    g.append('path')
      .datum(realData)
      .attr('fill', zircon)
      .attr('d', area)
  }, [realData, timeFrame])

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
export default RefLineChart
