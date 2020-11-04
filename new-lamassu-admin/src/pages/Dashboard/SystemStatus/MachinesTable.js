import { makeStyles, withStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import React, { useState, useEffect } from 'react'

import { Label2, TL2, Label1 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import {
  backgroundColor,
  offColor,
  errorColor,
  primaryColor
} from 'src/styling/variables'

// percentage threshold where below this number the text turns red
const PERCENTAGE_THRESHOLD = 20

const useStyles = makeStyles({
  label: {
    margin: 0,
    color: offColor
  },
  row: {
    backgroundColor: backgroundColor,
    borderBottom: 'none'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'pre'
  },
  error: {
    color: errorColor
  },
  button: {
    color: primaryColor,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
})

const StyledCell = withStyles({
  root: {
    borderBottom: '4px solid white'
  }
})(TableCell)

const MachinesTable = ({ machines }) => {
  // number of machines from the machines prop to render
  const [numRendered, setNumRendered] = useState(3)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [showLessButton, setShowLessButton] = useState(false)

  useEffect(() => {
    console.log('running effect')
    if (machines.length > numRendered) {
      setShowExpandButton(true)
    }
  }, [machines, numRendered])

  machines = [...machines, ...machines]
  const classes = useStyles()
  const getPercent = (notes, capacity = 500) => {
    return Math.round((notes / capacity) * 100)
  }

  const makePercentageText = (notes, capacity = 500) => {
    const percent = getPercent(notes, capacity)
    if (percent < PERCENTAGE_THRESHOLD) {
      return <TL2 className={classes.error}>{`${percent}%`}</TL2>
    }
    return <TL2>{`${percent}%`}</TL2>
  }

  const onExpand = () => {
    setShowExpandButton(false)
    setShowLessButton(true)
    setNumRendered(machines.length)
  }

  const onShrink = () => {
    setShowLessButton(false)
    setShowExpandButton(true)
    setNumRendered(3)
  }

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <StyledCell>
                <div className={classes.header}>
                  <Label2 className={classes.label}>Machines</Label2>
                </div>
              </StyledCell>
              <StyledCell>
                <div className={classes.header}>
                  <Label2 className={classes.label}>Status</Label2>
                </div>
              </StyledCell>
              <StyledCell>
                <div className={classes.header}>
                  <TxInIcon />
                </div>
              </StyledCell>
              <StyledCell>
                <div className={classes.header}>
                  <TxOutIcon />
                  <Label2 className={classes.label}> 1</Label2>
                </div>
              </StyledCell>
              <StyledCell>
                <div className={classes.header}>
                  <TxOutIcon />
                  <Label2 className={classes.label}> 2</Label2>
                </div>
              </StyledCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machines.map((machine, idx) => {
              if (idx < numRendered) {
                return (
                  <TableRow
                    key={machine.deviceId + idx}
                    className={classes.row}>
                    <StyledCell padding="none" align="left">
                      <TL2>{machine.name}</TL2>
                    </StyledCell>

                    <StyledCell>{machine.statuses[0].label}</StyledCell>
                    <StyledCell align="left">
                      {makePercentageText(machine.cashbox)}
                    </StyledCell>
                    <StyledCell align="left">
                      {makePercentageText(machine.cassette1)}
                    </StyledCell>
                    <StyledCell align="left">
                      {makePercentageText(machine.cassette2)}
                    </StyledCell>
                  </TableRow>
                )
              }
              return null
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {showExpandButton && (
        <>
          <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button
              onClick={onExpand}
              size="small"
              disableRipple
              disableFocusRipple
              className={classes.button}>
              {`Show all (${machines.length})`}
            </Button>
          </Label1>
        </>
      )}
      {showLessButton && (
        <>
          <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button
              onClick={onShrink}
              size="small"
              disableRipple
              disableFocusRipple
              className={classes.button}>
              {`Show less`}
            </Button>
          </Label1>
        </>
      )}
    </>
  )
}

export default MachinesTable
