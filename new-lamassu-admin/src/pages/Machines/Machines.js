import { useQuery } from '@apollo/react-hooks'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

import { TL1, TL2, Label3 } from 'src/components/typography'

import Cassettes from './MachineComponents/Cassettes'
import Commissions from './MachineComponents/Commissions'
import Details from './MachineComponents/Details'
import Overview from './MachineComponents/Overview'
import Transactions from './MachineComponents/Transactions'
import styles from './Machines.styles'
const useStyles = makeStyles(styles)

const getMachineInfo = R.compose(R.find, R.propEq('name'))

const GET_INFO = gql`
  query getInfo {
    machines {
      name
      deviceId
      paired
      lastPing
      pairedAt
      version
      model
      cashbox
      cassette1
      cassette2
      statuses {
        label
        type
      }
    }
    config
  }
`

const getMachines = R.path(['machines'])

const Machines = () => {
  const { data, refetch } = useQuery(GET_INFO)
  const location = useLocation()
  const classes = useStyles()

  const selectedMachine =
    R.path(['state', 'selectedMachine'])(location) ??
    R.path(['machines', 0, 'name'])(data) ??
    ''
  const machines = getMachines(data) ?? []
  const machineInfo = getMachineInfo(selectedMachine)(machines) ?? {}

  return (
    <Grid container className={classes.grid}>
      <Grid item xs={3}>
        <Grid item xs={12}>
          <div className={classes.breadcrumbsContainer}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
              <Link to="/dashboard" className={classes.breadcrumbLink}>
                <Label3 noMargin className={classes.subtitle}>
                  Dashboard
                </Label3>
              </Link>
              <TL2 noMargin className={classes.subtitle}>
                {selectedMachine}
              </TL2>
            </Breadcrumbs>
            <Overview data={machineInfo} onActionSuccess={refetch} />
          </div>
        </Grid>
        <Grid item xs={12}>
          {/* on hold for now <Sidebar
            isSelected={R.equals(selectedMachine)}
            selectItem={setSelectedMachine}
            data={machines}
            getText={R.prop('name')}
            getKey={R.prop('deviceId')}
          /> */}
        </Grid>
      </Grid>
      <Grid item xs={9}>
        <div className={classes.content}>
          <div
            className={classnames(classes.detailItem, classes.detailsMargin)}>
            <TL1 className={classes.subtitle}>{'Details'}</TL1>
            <Details data={machineInfo} />
          </div>
          <div className={classes.detailItem}>
            <TL1 className={classes.subtitle}>{'Cash cassettes'}</TL1>
            <Cassettes
              refetchData={refetch}
              machine={machineInfo}
              config={data?.config ?? false}
            />
          </div>
          <div className={classes.transactionsItem}>
            <TL1 className={classes.subtitle}>{'Latest transactions'}</TL1>
            <Transactions id={machineInfo?.deviceId ?? null} />
          </div>
          <div className={classes.detailItem}>
            <TL1 className={classes.subtitle}>{'Commissions'}</TL1>
            <Commissions
              name={'commissions'}
              id={machineInfo?.deviceId ?? null}
            />
          </div>
        </div>
      </Grid>
    </Grid>
  )
}

export default Machines
