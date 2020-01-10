import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import ExpTable from '../../components/expandable-table/ExpTable'
import { MainStatus } from '../../components/Status'
import Title from '../../components/Title'
import { ReactComponent as WarningIcon } from '../../styling/icons/status/pumpkin.svg'
import { ReactComponent as ErrorIcon } from '../../styling/icons/status/tomato.svg'
import { mainStyles } from '../Transactions/Transactions.styles'

import MachineDetailsRow from './MachineDetailsCard'

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
      paired
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

const MachineStatus = () => {
  const useStyles = makeStyles(mainStyles)

  const classes = useStyles()

  const { data: machinesResponse } = useQuery(GET_MACHINES)

  const elements = [
    {
      header: 'Machine Name',
      size: 232,
      textAlign: 'left',
      view: m => m.name
    },
    {
      header: 'Status',
      size: 349,
      textAlign: 'left',
      view: m => <MainStatus statuses={m.statuses} />
    },
    {
      header: 'Last ping',
      size: 192,
      textAlign: 'left',
      view: m => moment(m.lastPing).fromNow()
    },
    {
      header: 'Ping Time',
      size: 155,
      textAlign: 'left',
      view: m => m.pingTime || 'unknown'
    },
    {
      header: 'Software Version',
      size: 201,
      textAlign: 'left',
      view: m => m.softwareVersion || 'unknown'
    },
    {
      size: 71
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine Status</Title>
        </div>
        <div className={classes.headerLabels}>
          <div>
            <WarningIcon />
            <span>Warning</span>
          </div>
          <div>
            <ErrorIcon />
            <span>Error</span>
          </div>
        </div>
      </div>
      <ExpTable
        elements={elements}
        data={R.path(['machines'])(machinesResponse)}
        Details={MachineDetailsRow}
      />
    </>
  )
}

export default MachineStatus
