import { makeStyles } from '@material-ui/core'
import React from 'react'
import useAxios from '@use-hooks/axios'
import ExpTable from '../../components/expandable-table/ExpTable'
import Title from '../../components/Title'
import { ReactComponent as WarningIcon } from '../../styling/icons/status/pumpkin.svg'
import { ReactComponent as ErrorIcon } from '../../styling/icons/status/tomato.svg'
import MachineDetailsRow from './MachineDetailsCard'
import { mainStyles } from '../Transactions/Transactions.styles'
import moment from 'moment'
import { MainStatus } from '../../components/Status'

const MachineStatus = () => {
  const useStyles = makeStyles(mainStyles)

  const classes = useStyles()

  const { response } = useAxios({
    url: 'https://localhost:8070/api/machines',
    method: 'GET',
    trigger: []
  })

  const headers = [
    { value: 'Machine Name', className: classes.dateColumn, textAlign: 'left' },
    { value: 'Status', className: classes.dateColumn, textAlign: 'left' },
    { value: 'Last ping', className: classes.dateColumn, textAlign: 'left' },
    { value: 'Ping Time', className: classes.dateColumn, textAlign: 'left' },
    { value: 'Software Version', className: classes.dateColumn, textAlign: 'left' },
    { value: '' }
  ]

  const rows = response && response.data.machines.map(m => ({
    columns: [
      { value: m.name, className: classes.dateColumn, textAlign: 'left' },
      { value: <MainStatus statuses={m.statuses} />, className: classes.dateColumn, textAlign: 'left' },
      { value: moment(m.lastPing).fromNow(), className: classes.dateColumn, textAlign: 'left' },
      { value: m.pingTime || 'unknown', className: classes.dateColumn, textAlign: 'left' },
      { value: m.softwareVersion || 'unknown', className: classes.dateColumn, textAlign: 'left' }
    ],
    details: (
      <MachineDetailsRow machine={m} />
    )
  }))

  const sizes = [
    232, // Machine Name
    349, // Status
    192, // Last ping
    155, // Ping Time
    201, // Software Version
    71 // Expand
  ]

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
      <ExpTable headers={headers} rows={rows} sizes={sizes} className={classes.table} />
    </>
  )
}

export default MachineStatus
