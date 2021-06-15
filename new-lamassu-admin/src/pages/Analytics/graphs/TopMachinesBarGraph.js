import BigNumber from 'bignumber.js'
import * as d3 from 'd3'
import * as R from 'ramda'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  java,
  neon,
  subheaderDarkColor,
  fontColor,
  fontSecondary
} from 'src/styling/variables'

const Graph = ({ data, machines, currency }) => {
  const ref = useRef(null)

  const AMOUNT_OF_MACHINES = 5
  const BAR_PADDING = 0.15
  const BAR_MARGIN = 10
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

  const machinesClone = R.clone(machines)

  // This ensures that the graph renders a minimum amount of machines
  // and avoids having a single bar for cases with one machine
  const filledMachines =
    R.length(machines) >= AMOUNT_OF_MACHINES
      ? machinesClone
      : R.map(it => {
          if (!R.isNil(machinesClone[it])) return machinesClone[it]
          return { code: `ghostMachine${it}`, display: `` }
        }, R.times(R.identity, AMOUNT_OF_MACHINES))

  const txByDevice = R.reduce(
    (acc, value) => {
      acc[value.code] = R.filter(it => it.deviceId === value.code, data)
      return acc
    },
    {},
    filledMachines
  )

  const getDeviceVolume = deviceId =>
    R.reduce(
      (acc, value) => acc + BigNumber(value.fiat).toNumber(),
      0,
      txByDevice[deviceId]
    )

  const getDeviceVolumeByTxClass = deviceId =>
    R.reduce(
      (acc, value) => {
        if (value.txClass === 'cashIn')
          acc.cashIn += BigNumber(value.fiat).toNumber()
        if (value.txClass === 'cashOut')
          acc.cashOut += BigNumber(value.fiat).toNumber()
        return acc
      },
      { cashIn: 0, cashOut: 0 },
      txByDevice[deviceId]
    )

  const devicesByVolume = R.sort(
    (a, b) => b[1] - a[1],
    R.map(m => [m.code, getDeviceVolume(m.code)], filledMachines)
  )

  const topMachines = R.take(AMOUNT_OF_MACHINES, devicesByVolume)

  const txClassVolumeByDevice = R.fromPairs(
    R.map(v => [v[0], getDeviceVolumeByTxClass(v[0])], topMachines)
  )

  const x = d3
    .scaleBand()
    .domain(topMachines)
    .range([GRAPH_MARGIN.left, GRAPH_WIDTH - GRAPH_MARGIN.right])
    .paddingInner(BAR_PADDING)

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(topMachines, d => d[1]) !== 0 ? d3.max(topMachines, d => d[1]) : 50
    ])
    .range([GRAPH_HEIGHT - GRAPH_MARGIN.bottom, GRAPH_MARGIN.top])

  const buildXAxis = useCallback(
    g =>
      g
        .attr('class', 'x-axis-1')
        .attr(
          'transform',
          `translate(0, ${GRAPH_HEIGHT - GRAPH_MARGIN.bottom})`
        )
        .call(
          d3
            .axisBottom(x)
            .tickFormat(
              d =>
                `${R.find(it => it.code === d[0], filledMachines).display ??
                  ''}`
            )
            .tickSize(0)
            .tickPadding(10)
        ),
    [GRAPH_MARGIN, x, filledMachines]
  )

  const buildXAxis2 = useCallback(
    g => {
      g.attr('class', 'x-axis-2')
        .attr(
          'transform',
          `translate(0, ${GRAPH_HEIGHT - GRAPH_MARGIN.bottom})`
        )
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d =>
              R.includes(`ghostMachine`, d[0])
                ? ``
                : `${d[1].toFixed(2)} ${currency}`
            )
            .tickSize(0)
            .tickPadding(10)
        )
    },
    [GRAPH_MARGIN, x, currency]
  )

  const positionXAxisLabels = useCallback(() => {
    d3.selectAll('.x-axis-1 .tick text').attr('transform', function(d) {
      const widthPerEntry = (x.range()[1] - x.range()[0]) / AMOUNT_OF_MACHINES
      return `translate(${-widthPerEntry / 2.25 + this.getBBox().width / 2}, 0)`
    })
  }, [x])

  const positionXAxis2Labels = useCallback(() => {
    d3.selectAll('.x-axis-2 .tick text').attr('transform', function(d) {
      const widthPerEntry = (x.range()[1] - x.range()[0]) / AMOUNT_OF_MACHINES
      return `translate(${widthPerEntry / 2.25 - this.getBBox().width / 2}, 0)`
    })
  }, [x])

  const buildYAxis = useCallback(
    g =>
      g
        .attr('transform', `translate(${GRAPH_MARGIN.left}, 0)`)
        .call(
          d3
            .axisLeft(y)
            .ticks(GRAPH_HEIGHT / 100)
            .tickSize(0)
            .tickFormat(``)
        )
        .call(g => g.select('.domain').remove()),
    [GRAPH_MARGIN, y]
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

  const buildGrid = useCallback(
    g => {
      g.attr('stroke', subheaderDarkColor)
        .attr('fill', subheaderDarkColor)
        // Vertical lines
        .call(g =>
          g
            .append('g')
            .selectAll('line')
            .data(R.tail(x.domain()))
            .join('line')
            .attr('x1', d => {
              const domainIndex = R.findIndex(it => R.equals(it, d), x.domain())

              const xValue =
                x(x.domain()[domainIndex]) - x(x.domain()[domainIndex - 1])

              const paddedXValue = xValue * (BAR_PADDING / 2)
              return 0.5 + x(d) - paddedXValue
            })
            .attr('x2', d => {
              const domainIndex = R.findIndex(it => R.equals(it, d), x.domain())

              const xValue =
                x(x.domain()[domainIndex]) - x(x.domain()[domainIndex - 1])

              const paddedXValue = xValue * (BAR_PADDING / 2)
              return 0.5 + x(d) - paddedXValue
            })
            .attr('y1', GRAPH_MARGIN.top)
            .attr('y2', GRAPH_HEIGHT - GRAPH_MARGIN.bottom)
        )
    },
    [GRAPH_MARGIN, x]
  )

  const drawCashIn = useCallback(
    g => {
      g.selectAll('rect')
        .data(R.toPairs(txClassVolumeByDevice))
        .join('rect')
        .attr('fill', java)
        .attr('x', d => x([d[0], d[1].cashIn + d[1].cashOut]))
        .attr('y', d => y(d[1].cashIn) - GRAPH_MARGIN.top + GRAPH_MARGIN.bottom)
        .attr('height', d =>
          R.clamp(
            0,
            GRAPH_HEIGHT,
            GRAPH_HEIGHT - y(d[1].cashIn) - GRAPH_MARGIN.bottom - BAR_MARGIN
          )
        )
        .attr('width', x.bandwidth())
        .attr('rx', 2.5)
    },
    [txClassVolumeByDevice, x, y, GRAPH_MARGIN]
  )

  const drawCashOut = useCallback(
    g => {
      g.selectAll('rect')
        .data(R.toPairs(txClassVolumeByDevice))
        .join('rect')
        .attr('fill', neon)
        .attr('x', d => x([d[0], d[1].cashIn + d[1].cashOut]))
        .attr(
          'y',
          d =>
            y(d[1].cashIn + d[1].cashOut) -
            GRAPH_MARGIN.top +
            GRAPH_MARGIN.bottom
        )
        .attr('height', d => {
          return R.clamp(
            0,
            GRAPH_HEIGHT,
            GRAPH_HEIGHT -
              y(d[1].cashOut) -
              GRAPH_MARGIN.bottom -
              BAR_MARGIN / 2
          )
        })
        .attr('width', x.bandwidth())
        .attr('rx', 2.5)
    },
    [txClassVolumeByDevice, x, y, GRAPH_MARGIN]
  )

  const drawChart = useCallback(() => {
    const svg = d3
      .select(ref.current)
      .attr('viewBox', [0, 0, GRAPH_WIDTH, GRAPH_HEIGHT])

    svg.append('g').call(buildXAxis)
    svg.append('g').call(buildXAxis2)
    svg.append('g').call(buildYAxis)
    svg.append('g').call(formatTicksText)
    svg.append('g').call(buildGrid)
    svg.append('g').call(drawCashIn)
    svg.append('g').call(drawCashOut)
    svg.append('g').call(positionXAxisLabels)
    svg.append('g').call(positionXAxis2Labels)

    return svg.node()
  }, [
    buildXAxis,
    buildXAxis2,
    positionXAxisLabels,
    positionXAxis2Labels,
    buildYAxis,
    formatTicksText,
    buildGrid,
    drawCashIn,
    drawCashOut
  ])

  useEffect(() => {
    d3.select(ref.current)
      .selectAll('*')
      .remove()
    drawChart()
  }, [drawChart])

  return <svg ref={ref} />
}

export default memo(Graph, (prev, next) => R.equals(prev.period, next.period))
