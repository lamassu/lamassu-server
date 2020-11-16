import * as d3 from 'd3'
import * as R from 'ramda'
import React, { useEffect, useRef, useCallback, useState } from 'react'

import { backgroundColor, zircon, primaryColor } from 'src/styling/variables'

const RefLineChart = ({ data: realData, timeFrame }) => {
  const svgRef = useRef()

  // this variable will flip to true if there's no data points or the profit is zero
  // this will force the line graph to touch the x axis instead of centering,
  // centering is bad because it gives the impression that there could be negative values
  // so, if this is true the y domain should be [0, 0.1]
  const [zeroProfit, setZeroProfit] = useState(false)

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
      let aggregatedTX = groupedTx.map(list => {
        const temp = { ...list[0], profit: transactionProfit(list[0]) }
        if (list.length > 1) {
          for (let i = 1; i < list.length; i++) {
            temp.profit += transactionProfit(list[i])
          }
        }
        return temp
      })

      // if no point exists, then create a (0,0) point
      if (aggregatedTX.length === 0) {
        setZeroProfit(true)
        aggregatedTX = [{ created: new Date().toISOString(), profit: 0 }]
      } else {
        setZeroProfit(false)
      }
      // create point on the left if only one point exists, otherwise line won't be drawn
      if (aggregatedTX.length === 1) {
        const temp = { ...aggregatedTX[0] }
        const date = new Date(temp.created)
        date.setHours(date.getHours() - 1)
        temp.created = date.toISOString()
        aggregatedTX = [...aggregatedTX, temp]
      }
      return aggregatedTX
    }

    /* Important step to make the graph look good!
       This function groups transactions by either day or hour depending on the time grame
       This makes the line look smooth and not all wonky when there are many transactions in a given time
    */
    const data = massageData()

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
      .range([height, 0])
      // I add 200 to the chart so that the percentage increase and profit labels are not drawn over the line. Theyre the same color so it would look bad
      .domain([0, yDomain[1] === 0.1 ? yDomain[1] : yDomain[1] + 200])
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
  }, [realData, timeFrame, zeroProfit])

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
