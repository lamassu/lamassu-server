import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { TL1 } from 'src/components/typography'

import Details from './MachineComponents/Details'
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
  }
`

// const getName = R.path(['name'])
const getMachines = R.path(['machines'])

const Machines = () => {
  const { data } = useQuery(GET_INFO)
  const [selectedMachine, setSelectedMachine] = useState('')
  const classes = useStyles()

  const machines = getMachines(data) ?? []
  const machineInfo = getMachineInfo(selectedMachine)(machines) ?? []
  return (
    <>
      <TitleSection title="Machine details page" />
      <Grid container className={classes.grid}>
        <Sidebar
          data={machines}
          isSelected={it => it.name === selectedMachine}
          displayName={it => it.name}
          onClick={it => setSelectedMachine(it.name)}
        />
        <div className={classes.content}>
          {/* last ping status and actions moved here */}
          <TL1 className={classes.subtitle}>{'Details'}</TL1>
          <Details data={machineInfo} />
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
