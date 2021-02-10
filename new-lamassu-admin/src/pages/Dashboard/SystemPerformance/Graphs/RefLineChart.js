import * as d3 from 'd3'
import * as R from 'ramda'
import React, { useEffect, useRef, useCallback } from 'react'

import { backgroundColor, zircon, primaryColor } from 'src/styling/variables'

const transactionProfit = tx => {
  const cashInFee = tx.cashInFee ? Number.parseFloat(tx.cashInFee) : 0
  const commission =
    Number.parseFloat(tx.commissionPercentage) * Number.parseFloat(tx.fiat)
  return commission + cashInFee
}

const mockPoint = tx => {
  const date = new Date(tx.created)
  date.setHours(date.getHours() - 1)
  return { created: date.toISOString(), profit: tx.profit }
}

// if we're viewing transactions for the past day, then we group by hour. If not, we group by day
const formatDay = ({ created }) =>
  new Date(created).toISOString().substring(0, 10)
const formatHour = ({ created }) =>
  new Date(created).toISOString().substring(0, 13)

const reducer = (acc, tx) => {
  const currentProfit = acc.profit || 0
  return { ...tx, profit: currentProfit + transactionProfit(tx) }
}

const timeFrameMS = {
  Day: 24 * 3600 * 1000,
  Week: 7 * 24 * 3600 * 1000,
  Month: 30 * 24 * 3600 * 1000
}

const RefLineChart = ({
  data: realData,
  previousTimeData,
  previousProfit,
  timeFrame
}) => {
  const svgRef = useRef()

  const drawGraph = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const margin = { top: 0, right: 0, bottom: 0, left: 0 }
    const width = 336 - margin.left - margin.right
    const height = 128 - margin.top - margin.bottom

    const massageData = () => {
      // if we're viewing transactions for the past day, then we group by hour. If not, we group by day
      const method = timeFrame === 'Day' ? formatHour : formatDay

      const aggregatedTX = R.values(R.reduceBy(reducer, [], method, realData))
      // if no point exists, then return 2 points at y = 0
      if (!aggregatedTX.length && !previousTimeData.length) {
        const mockPoint1 = { created: new Date().toISOString(), profit: 0 }
        const mockPoint2 = mockPoint(mockPoint1)
        return [[mockPoint1, mockPoint2], true]
      }
      // if this time period has no txs, but previous time period has, then % change is -100%
      if (!aggregatedTX.length && previousTimeData.length) {
        const mockPoint1 = {
          created: new Date().toISOString(),
          profit: 0
        }
        const mockPoint2 = {
          created: new Date(Date.now() - 1).toISOString(),
          profit: 1
        }
        return [[mockPoint1, mockPoint2], false]
      }
      // if this time period has txs, but previous doesn't, then % change is +100%
      if (aggregatedTX.length && !previousTimeData.length) {
        const mockPoint1 = {
          created: new Date().toISOString(),
          profit: 1
        }
        const mockPoint2 = {
          created: new Date(Date.now() - timeFrameMS[timeFrame]).toISOString(),
          profit: 0
        }
        return [[mockPoint1, mockPoint2], false]
      }
      // if only one point exists, create point on the left - otherwise the line won't be drawn
      if (aggregatedTX.length === 1) {
        return [
          R.append(
            {
              created: new Date(
                Date.now() - timeFrameMS[timeFrame]
              ).toISOString(),
              profit: previousProfit
            },
            aggregatedTX
          ),
          false
        ]
      }
      // the boolean value is for zeroProfit. It makes the line render at y = 0 instead of y = 50% of container height
      return [aggregatedTX, false]
    }

    /* Important step to make the graph look good!
       This function groups transactions by either day or hour depending on the time frame
       This makes the line look smooth and not all wonky when there are many transactions in a given time
    */
    const [data, zeroProfit] = massageData()

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

    // gradient color for the graph (creates the "url", the color is applied by calling the url, in the area color fill )
    svg
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: zircon },
        { offset: '25%', color: zircon },
        { offset: '100%', color: backgroundColor }
      ])
      .enter()
      .append('stop')
      .attr('offset', function(d) {
        return d.offset
      })
      .attr('stop-color', function(d) {
        return d.color
      })

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xDomain = d3.extent(data, t => t.created)
    const yDomain = zeroProfit ? [0, 0.1] : [0, d3.max(data, t => t.profit)]

    const y = d3
      .scaleLinear()
      // 30 is a margin so that the labels and the percentage change label can fit and not overlay the line path
      .range([height, 30])
      .domain([0, yDomain[1]])
    const x = d3
      .scaleTime()
      .domain([new Date(xDomain[0]), new Date(xDomain[1])])
      .range([0, width])

    const line = d3
      .line()
      .x(function(d) {
        return x(new Date(d.created))
      })
      .y(function(d) {
        return y(d.profit)
      })

    const area = d3
      .area()
      .x(function(d) {
        return x(new Date(d.created))
      })
      .y0(height)
      .y1(function(d) {
        return y(d.profit)
      })

    // area color fill
    g.append('path')
      .datum(data)
      .attr('d', area)
      .attr('fill', 'url(#area-gradient)')
    // draw the line
    g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke-width', '2')
      .attr('stroke-linejoin', 'round')
      .attr('stroke', primaryColor)
  }, [realData, timeFrame, previousTimeData, previousProfit])

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
