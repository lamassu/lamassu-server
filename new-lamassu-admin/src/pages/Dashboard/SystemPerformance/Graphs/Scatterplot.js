/*eslint-disable*/
import { scaleLinear, scaleTime, max, axisLeft, axisBottom, select } from 'd3'
import React, { useMemo } from 'react'
import moment from 'moment'

const data = [
  [0, '2020-11-08T18:00:05.664Z'],
  [40.01301, '2020-11-09T11:17:05.664Z']
]

const marginTop = 10
const marginRight = 30
const marginBottom = 30
const marginLeft = 60
const width = 510 - marginLeft - marginRight
const height = 141 - marginTop - marginBottom

const Scatterplot = ({ data: realData }) => {
  const x = scaleTime()
    .domain([
      moment()
        .add(-1, 'day')
        .valueOf(),
      moment().valueOf()
    ])
    .range([0, width])
    .nice()

  const y = scaleLinear()
    .domain([0, 1000])
    .range([height, 0])
    .nice()

  // viewBox="0 0 540 141"
  return (
    <>
      <svg
        width={width + marginLeft + marginRight}
        height={height + marginTop + marginBottom}>
        <g transform={`translate(${marginLeft},${marginTop})`}>
          <XAxis
            transform={`translate(0, ${height + marginTop})`}
            scale={x}
            numTicks={6}
          />
          <g>{axisLeft(y)}</g>
          {/* <YAxis transform={`translate(0, 0)`} scale={y} numTicks={6} /> */}
          <RenderCircles data={data} scale={{ x, y }} />
        </g>
      </svg>
    </>
  )
}

const XAxis = ({
  range = [10, 500],
  transform,
  scale: xScale,
  numTicks = 7
}) => {
  const ticks = useMemo(() => {
    return xScale.ticks(numTicks).map(value => ({
      value,
      xOffset: xScale(value)
    }))
  }, [range.join('-')])

  return (
    <g transform={transform}>
      {ticks.map(({ value, xOffset }) => (
        <g key={value} transform={`translate(${xOffset}, 0)`}>
          <text
            key={value}
            style={{
              fontSize: '10px',
              textAnchor: 'middle',
              transform: 'translateY(10px)'
            }}>
            {value.getHours()}
          </text>
        </g>
      ))}
    </g>
  )
}

const YAxis = ({
  range = [10, 500],
  transform,
  scale: xScale,
  numTicks = 7
}) => {
  const ticks = useMemo(() => {
    return xScale.ticks(numTicks).map(value => ({
      value,
      xOffset: xScale(value)
    }))
  }, [range.join('-')])

  return (
    <g transform={transform}>
      {ticks.map(({ value, xOffset }) => (
        <g key={value} transform={`translate(0, ${xOffset})`}>
          <text
            key={value}
            style={{
              fontSize: '10px',
              textAnchor: 'middle',
              transform: 'translateX(-10px)'
            }}>
            {value}
          </text>
        </g>
      ))}
    </g>
  )
}

const RenderCircles = ({ data, scale }) => {
  let renderCircles = data.map((item, idx) => {
    return (
      <circle
        cx={scale.x(new Date(item[1]))}
        cy={scale.y(item[0])}
        r="4"
        style={{ fill: 'rgba(25, 158, 199, .9)' }}
        key={idx}
      />
    )
  })
  return <g>{renderCircles}</g>
}

export default Scatterplot
