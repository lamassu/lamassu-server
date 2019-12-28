import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import SingleRowTable from 'src/components/single-row-table/SingleRowTable'

const getValue = R.curry((account, code) => account[code] ?? '')

const formatLong = value => {
  if (!value) return ''
  if (value.length <= 20) return value

  return `${value.slice(0, 8)}(...)${value.slice(
    value.length - 8,
    value.length
  )}`
}

const styles = {
  card: {
    margin: [[0, 30, 32, 0]],
    paddingBottom: 24,
    '&:nth-child(3n+3)': {
      marginRight: 0
    }
  }
}

const useStyles = makeStyles(styles)

const Card = ({ account, title, items, onEdit, ...props }) => {
  const classes = useStyles()

  return (
    <SingleRowTable
      title={title}
      items={items}
      className={classes.card}
      onEdit={onEdit}
    />
  )
}

export { Card, getValue, formatLong }
