/* eslint-disable */
import * as d3 from 'd3'
// import moment from 'moment'
import * as R from 'ramda'
import React, { useEffect, useRef, useCallback } from 'react'

import { backgroundColor, zircon, primaryColor } from 'src/styling/variables'

const RefLineChart = ({ data: realData, timeFrame }) => {
  const svgRef = useRef()

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

    const massageData = () => {
      const methods = {
        day: function(obj) {
          return new Date(obj.created).toISOString().substring(0, 10)
        },
        hour: function(obj) {
          return new Date(obj.created).toISOString().substring(0, 13)
        }
      }

      const method = timeFrame === 'Day' ? 'hour' : 'day'
      const f = methods[method]
      const groupedTx = R.values(R.groupBy(f)(realData))
      const aggregatedTX = groupedTx.map(list => {
        let temp = { ...list[0], profit: transactionProfit(list[0]) }
        if (list.length > 1) {
          for (let i = 1; i < list.length; i++) {
            temp.profit += transactionProfit(list[i])
          }
        }
        return temp
      })

      return aggregatedTX
    }

    /* Important step to make the graph look good!
       This function groups transactions by either day or hour depending on the time grame
       This makes the line look smooth and not all wonky when there are many transactions in a given time
    */
    const data = massageData()

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
          massageData('day')
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

    const xDomain = d3.extent(data, t => t.created)
    const yDomain = d3.extent(data, t => t.profit)
    const xAxisSettings = findXAxisSettings()
    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, yDomain[1]])
      .nice(3)
    const x = d3
      .scaleTime()
      .domain([new Date(xDomain[0]), new Date(xDomain[1])])

      .range(xAxisSettings.timeRange)
      .nice(xAxisSettings.nice)

    const line = d3
      .line()
      // .curve(d3.curveCatmullRom.alpha(0.5))
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
      .datum(data)
      .attr('d', line)
      .attr('stroke', primaryColor)
      .attr('stroke-width', '3')
      .attr('stroke-linejoin', 'round')
      .style('fill', 'none')

    g.append('path')
      .datum(data)
      .attr('fill', zircon)
      .attr('d', area)
  }, [realData, timeFrame])

  useEffect(() => {
    // first we clear old chart DOM elements on component update
    d3.select(svgRef.current)
      .selectAll('*')
      .remove()
    drawGraph()
  }, [drawGraph, realData])

  return (
    <>
      <svg ref={svgRef} />
    </>
  )
}
export default RefLineChart
