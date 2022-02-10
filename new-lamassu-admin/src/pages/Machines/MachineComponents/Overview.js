import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import { formatDistance } from 'date-fns'
import React from 'react'

import { Status } from 'src/components/Status'
import MachineActions from 'src/components/machineActions/MachineActions'
import { H3, Label3, P } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard.js'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)

const Overview = ({ data, onActionSuccess }) => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <H3>{data.name}</H3>
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Status</Label3>
          {data && data.statuses ? <Status status={data.statuses[0]} /> : null}
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Last ping</Label3>
          <P>
            {data.lastPing
              ? formatDistance(new Date(data.lastPing), new Date(), {
                  addSuffix: true
                })
              : 'unknown'}
          </P>
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Network speed</Label3>
          <P>
            {data.downloadSpeed
              ? new BigNumber(data.downloadSpeed).toFixed(4).toString() +
                '  MB/s'
              : 'unavailable'}
          </P>
        </div>
      </div>
      <div className={classes.row}>
        <MachineActions
          machine={data}
          onActionSuccess={onActionSuccess}></MachineActions>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label3 className={classes.label3}>Device ID</Label3>
          <P>
            <CopyToClipboard buttonClassname={classes.copyToClipboard}>
              {data.deviceId}
            </CopyToClipboard>
          </P>
        </div>
      </div>
    </>
  )
}

export default Overview
