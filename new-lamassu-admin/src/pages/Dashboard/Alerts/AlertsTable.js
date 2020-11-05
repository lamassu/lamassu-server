/*eslint-disable*/
import { makeStyles, withStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import React, { useState, useEffect } from 'react'

import { Status } from 'src/components/Status'
import { Label2, TL2, Label1 } from 'src/components/typography'
import styles from './Alerts.styles'
const useStyles = makeStyles(styles)

const AlertsTable = ({ numToRender, alerts }) => {
  const classes = useStyles()

  return (
    <>
      <h1>Alerts table</h1>
    </>
  )
}

export default AlertsTable
