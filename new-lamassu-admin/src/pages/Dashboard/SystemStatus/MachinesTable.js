import { useQuery } from '@apollo/react-hooks'
import { makeStyles, withStyles } from '@material-ui/core'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import { useHistory } from 'react-router-dom'

import { Status } from 'src/components/Status'
import { Label2, TL2 } from 'src/components/typography'
// import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ReactComponent as MachineLinkIcon } from 'src/styling/icons/month arrows/right.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './MachinesTable.styles'

// percentage threshold where below this number the text in the cash cassettes percentage turns red
const PERCENTAGE_THRESHOLD = 20

const GET_CONFIG = gql`
  query getConfig {
    config
  }
`

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

const MachinesTable = ({ machines = [], numToRender }) => {
  const classes = useStyles()
  const history = useHistory()

  const { data } = useQuery(GET_CONFIG)
  const fillingPercentageSettings = fromNamespace(
    'notifications',
    R.path(['config'], data) ?? {}
  )

  const getPercent = (notes, capacity = 500) => {
    return Math.round((notes / capacity) * 100)
  }

  const makePercentageText = (cassetteIdx, notes, capacity = 500) => {
    const percent = getPercent(notes, capacity)
    const percentageThreshold = R.pipe(
      R.path([`fillingPercentageCassette${cassetteIdx}`]),
      R.defaultTo(PERCENTAGE_THRESHOLD)
    )(fillingPercentageSettings)
    return percent < percentageThreshold ? (
      <TL2 className={classes.error}>{`${percent}%`}</TL2>
    ) : (
      <TL2>{`${percent}%`}</TL2>
    )
  }

  const redirect = ({ name, deviceId }) => {
    return history.push(`/machines/${deviceId}`, {
      selectedMachine: name
    })
  }

  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    0
  )

  return (
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
            {/*               <HeaderCell>
                <div className={classes.header}>
                  <TxInIcon />
                </div>
              </HeaderCell> */}
            {R.map(
              it => (
                <HeaderCell>
                  <div className={classes.header}>
                    <TxOutIcon />
                    <Label2 className={classes.label}> {it + 1}</Label2>
                  </div>
                </HeaderCell>
              ),
              R.times(R.identity, maxNumberOfCassettes)
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {machines.map((machine, idx) => {
            if (idx < numToRender) {
              return (
                <TableRow
                  onClick={() => redirect(machine)}
                  className={classnames(classes.row)}
                  key={machine.deviceId + idx}>
                  <StyledCell align="left">
                    <div className={classes.machineNameWrapper}>
                      <TL2>{machine.name}</TL2>
                      <MachineLinkIcon
                        className={classnames(
                          classes.machineRedirectIcon,
                          classes.clickableRow
                        )}
                        onClick={() => redirect(machine)}
                      />
                    </div>
                  </StyledCell>
                  <StyledCell>
                    <Status status={machine.statuses[0]} />
                  </StyledCell>
                  {R.map(
                    it =>
                      machine.numberOfCassettes >= it ? (
                        <StyledCell align="left">
                          {makePercentageText(
                            it,
                            machine.cashUnits[`cassette${it}`]
                          )}
                        </StyledCell>
                      ) : (
                        <StyledCell align="left">
                          <TL2>{`— %`}</TL2>
                        </StyledCell>
                      ),
                    R.range(1, maxNumberOfCassettes + 1)
                  )}
                </TableRow>
              )
            }
            return null
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default MachinesTable
