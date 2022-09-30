import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import { formatDistance } from 'date-fns'
import * as R from 'ramda'
import React from 'react'

import { Status } from 'src/components/Status'
import MachineActions from 'src/components/machineActions/MachineActions'
import { H3, Label1, P } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard.js'

import styles from '../Machines.styles'
const useStyles = makeStyles(styles)

const Overview = ({ data, onActionSuccess }) => {
  const classes = useStyles()

  return (
    <div className={classes.contentContainer}>
      <div className={classes.overviewRow}>
        <div className={classes.machineBackground}></div>
        <div className={classes.overviewInfo}>
          <div className={classes.rowItem}>
            <H3>{data.name}</H3>
          </div>
          {!R.isNil(data.location) && (
            <div>
              <Label1 noMargin>Address</Label1>
              <P noMargin>
                {`${data.location.addressLine1}${
                  data.location.addressLine2
                    ? `, ${data.location.addressLine2}`
                    : ``
                }, ${data.location.zipCode}, ${data.location.country}`}
              </P>
            </div>
          )}
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label1 noMargin className={classes.label3}>
            Status
          </Label1>
          {data && data.statuses ? <Status status={data.statuses[0]} /> : null}
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label1 className={classes.label3}>Ping</Label1>
          <P noMargin>
            {data.responseTime
              ? new BigNumber(data.responseTime).toFixed(3).toString() + ' ms'
              : 'unavailable'}
          </P>
        </div>
        <div className={classes.rowItem}>
          <Label1 className={classes.label3}>Last ping</Label1>
          <P noMargin>
            {data.lastPing
              ? formatDistance(new Date(data.lastPing), new Date(), {
                  addSuffix: true
                })
              : 'unknown'}
          </P>
        </div>
        <div className={classes.rowItem}>
          <Label1 className={classes.label3}>Network speed</Label1>
          <P noMargin>
            {data.downloadSpeed
              ? new BigNumber(data.downloadSpeed)
                  .toFixed(data.downloadSpeed < 10 ? 2 : 0)
                  .toString() + ' MB/s'
              : 'unavailable'}
          </P>
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.rowItem}>
          <Label1 className={classes.label3}>Device ID</Label1>
          <P noMargin>
            <CopyToClipboard buttonClassname={classes.copyToClipboard}>
              {data.deviceId}
            </CopyToClipboard>
          </P>
        </div>
      </div>
      <div className={classes.row}>
        <MachineActions
          machine={data}
          onActionSuccess={onActionSuccess}></MachineActions>
      </div>
    </div>
  )
}

export default Overview
