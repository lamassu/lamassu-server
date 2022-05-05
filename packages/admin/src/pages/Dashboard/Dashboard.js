import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

import { Button } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import { H1, Info2, TL2, Label1 } from 'src/components/typography'
import AddMachine from 'src/pages/AddMachine'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { errorColor } from 'src/styling/variables'

import styles from './Dashboard.styles'
import Footer from './Footer'
import LeftSide from './LeftSide'
import RightSide from './RightSide'
const useStyles = makeStyles(styles)

const GET_DATA = gql`
  query getData {
    machines {
      name
    }
    serverVersion
  }
`

const Dashboard = () => {
  const history = useHistory()
  const classes = useStyles()
  const [open, setOpen] = useState(false)

  const { data, loading } = useQuery(GET_DATA)

  const onPaired = machine => {
    setOpen(false)
    history.push('/maintenance/machine-status', { id: machine.deviceId })
  }

  return !loading ? (
    !R.isEmpty(data.machines) ? (
      <>
        <TitleSection title="Dashboard">
          <div className={classes.headerLabels}>
            <div>
              <TxInIcon />
              <span>Cash-in</span>
            </div>
            <div>
              <TxOutIcon />
              <span>Cash-out</span>
            </div>
            <div>
              <svg width={12} height={12}>
                <rect width={12} height={12} rx={3} fill={errorColor} />
              </svg>
              <span>Action Required</span>
            </div>
          </div>
        </TitleSection>
        <div className={classes.root}>
          <Grid container>
            <Grid container direction="column" item xs={6}>
              <LeftSide />
            </Grid>
            <Grid container direction="column" item xs={6}>
              <RightSide />
            </Grid>
          </Grid>
        </div>
        <Footer />
      </>
    ) : (
      <>
        {open && (
          <AddMachine close={() => setOpen(false)} onPaired={onPaired} />
        )}
        <TitleSection title="Dashboard">
          <div className={classes.headerLabels}>
            <span>
              <TL2 className={classes.inline}>{data?.serverVersion}</TL2>{' '}
              <Label1 className={classes.inline}> server version</Label1>
            </span>
          </div>
        </TitleSection>
        <div className={classes.emptyMachinesRoot}>
          <div className={classes.emptyMachinesContent}>
            <H1 className={classes.offColor}>No machines on your system yet</H1>
            <Info2 className={classes.offColor}>
              To fully take advantage of Lamassu Admin, add a new machine to
              your system
            </Info2>
            <Button onClick={() => setOpen(true)}>+ Add new machine</Button>
          </div>
        </div>
        <Footer />
      </>
    )
  ) : (
    <></>
  )
}

export default Dashboard
