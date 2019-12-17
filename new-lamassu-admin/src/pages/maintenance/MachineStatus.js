import { makeStyles } from '@material-ui/core'
import useAxios from '@use-hooks/axios'
import moment from 'moment'
import React from 'react'
import ExpTable from '../../components/expandable-table/ExpTable'
import { MainStatus } from '../../components/Status'
import Title from '../../components/Title'
import { ReactComponent as WarningIcon } from '../../styling/icons/status/pumpkin.svg'
import { ReactComponent as ErrorIcon } from '../../styling/icons/status/tomato.svg'
import { mainStyles } from '../Transactions/Transactions.styles'
import MachineDetailsRow from './MachineDetailsCard'

const MachineStatus = () => {
  const useStyles = makeStyles(mainStyles)

  const classes = useStyles()

  const { response } = useAxios({
    url: 'https://localhost:8070/api/machines',
    method: 'GET',
    trigger: []
  })

  const rows = response && response.data.machines.map(m => ({
    columns: [
      {
        name: 'Machine Name',
        size: 232,
        value: m.name,
        className: classes.dateColumn,
        textAlign: 'left'
      },
      {
        name: 'Status',
        size: 349,
        value: <MainStatus statuses={m.statuses} />,
        className: classes.dateColumn,
        textAlign: 'left'
      },
      {
        name: 'Last ping',
        size: 192,
        value: moment(m.lastPing).fromNow(),
        className: classes.dateColumn,
        textAlign: 'left'
      },
      {
        name: 'Ping Time',
        size: 155,
        value: m.pingTime || 'unknown',
        className: classes.dateColumn,
        textAlign: 'left'
      },
      {
        name: 'Software Version',
        size: 201,
        value: m.softwareVersion || 'unknown',
        className: classes.dateColumn,
        textAlign: 'left'
      },
      {
        size: 71
      }
    ],
    details: (
      <MachineDetailsRow machine={m} />
    )
  }))

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine Status</Title>
        </div>
        <div className={classes.headerLabels}>
          <div><WarningIcon /><span>Warning</span></div>
          <div><ErrorIcon /><span>Error</span></div>
        </div>
      </div>
      <ExpTable rows={rows} />
    </>
  )
}

export default MachineStatus
