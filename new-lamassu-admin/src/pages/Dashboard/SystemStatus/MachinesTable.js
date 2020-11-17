import { makeStyles, withStyles } from '@material-ui/core'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import React from 'react'

import { Status } from 'src/components/Status'
import { Label2, TL2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import styles from './MachinesTable.styles'

// percentage threshold where below this number the text in the cash cassettes percentage turns red
const PERCENTAGE_THRESHOLD = 20

const useStyles = makeStyles(styles)

const StyledCell = withStyles({
  root: {
    borderBottom: '4px solid white',
    padding: 0,
    paddingLeft: 15
  }
})(TableCell)

const HeaderCell = withStyles({
  root: {
    borderBottom: '4px solid white',
    padding: 0,
    paddingLeft: 15,
    backgroundColor: 'white'
  }
})(TableCell)

const MachinesTable = ({ machines, numToRender }) => {
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
  return (
    <>
      <TableContainer className={classes.table}>
        <Table>
          <TableHead>
            <TableRow>
              <HeaderCell>
                <div className={classes.header}>
                  <Label2 className={classes.label}>Machines</Label2>
                </div>
              </HeaderCell>
              <HeaderCell>
                <div className={`${classes.header} ${classes.statusHeader}`}>
                  <Label2 className={classes.label}>Status</Label2>
                </div>
              </HeaderCell>
              <HeaderCell>
                <div className={classes.header}>
                  <TxInIcon />
                </div>
              </HeaderCell>
              <HeaderCell>
                <div className={classes.header}>
                  <TxOutIcon />
                  <Label2 className={classes.label}> 1</Label2>
                </div>
              </HeaderCell>
              <HeaderCell>
                <div className={classes.header}>
                  <TxOutIcon />
                  <Label2 className={classes.label}> 2</Label2>
                </div>
              </HeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machines.map((machine, idx) => {
              if (idx < numToRender) {
                return (
                  <TableRow
                    key={machine.deviceId + idx}
                    className={classes.row}>
                    <StyledCell align="left">
                      <TL2>{machine.name}</TL2>
                    </StyledCell>
                    <StyledCell>
                      <Status status={machine.statuses[0]} />
                    </StyledCell>
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
    </>
  )
}

export default MachinesTable
