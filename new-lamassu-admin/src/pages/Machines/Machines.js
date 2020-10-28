import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { TL1 } from 'src/components/typography'

import styles from './Machines.styles'

const useStyles = makeStyles(styles)

const GET_INFO = gql`
  query getInfo {
    machines {
      deviceId
      name
      model
      cassette1
      cashbox
    }
  }
`

// const getName = R.path(['name'])
const getMachines = R.path(['machines'])

const Machines = () => {
  const { data } = useQuery(GET_INFO)
  const classes = useStyles()

  const machines = getMachines(data) ?? []
  // const machineNames = R.map(getName)(machines)
  console.log(data)
  return (
    <>
      <TitleSection title="Machine details page" />
      <Grid container className={classes.grid}>
        <Sidebar
          data={machines}
          isSelected={() => true}
          displayName={it => it.name}
        />
        <div className={classes.content}>
          <TL1 className={classes.subtitle}>{'Details'}</TL1>
          <p>Here be details</p>
          <TL1 className={classes.subtitle}>{'Cashboxes (cassettes?)'}</TL1>
          <p>Here be cash cassette details</p>
          <TL1 className={classes.subtitle}>{'Latest transactions'}</TL1>
          <p>Here be latest transactions</p>
          <TL1 className={classes.subtitle}>{'Commissions'}</TL1>
          <p>Here be commissions</p>
        </div>
      </Grid>
    </>
  )
}

export default Machines
