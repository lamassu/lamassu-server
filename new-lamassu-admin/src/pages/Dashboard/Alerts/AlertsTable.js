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

// number of machines in the table to render on page load
const NUM_TO_RENDER = 3

const AlertsTable = ({ machines, handleExpandTable, showAllItems }) => {
  const classes = useStyles()

  const [numToRender, setNumToRender] = useState(NUM_TO_RENDER)
  const [showExpandButton, setShowExpandButton] = useState(false)

  useEffect(() => {
    // TODO first if needs more loic, check useEffect of MachinesTable
    // to be done when data gets fetched for this component
    if (!showAllItems) {
      setShowExpandButton(true)
    }
    if (showAllItems) {
      setNumToRender(999)
    } else {
      setNumToRender(NUM_TO_RENDER)
    }
  }, [numToRender, showAllItems])

  const onExpand = () => {
    setShowExpandButton(false)
    handleExpandTable('expand')
    setNumToRender(999)
  }

  return (
    <>
      <h1>Alerts table</h1>
      {showExpandButton && (
        <>
          <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button
              onClick={onExpand}
              size="small"
              disableRipple
              disableFocusRipple
              className={classes.button}>
              {`Show all (number here)`}
            </Button>
          </Label1>
        </>
      )}
    </>
  )
}

export default AlertsTable
