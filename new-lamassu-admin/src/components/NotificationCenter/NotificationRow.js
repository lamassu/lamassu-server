import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import prettyMs from 'pretty-ms'
import * as R from 'ramda'
import React from 'react'

import { Label1, Label2, TL2 } from 'src/components/typography'
import { ReactComponent as Wrench } from 'src/styling/icons/action/wrench/zodiac.svg'
import { ReactComponent as Transaction } from 'src/styling/icons/arrow/transaction.svg'
import { ReactComponent as StripesSvg } from 'src/styling/icons/stripes.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/tomato.svg'

import styles from './NotificationCenter.styles'
const useStyles = makeStyles(styles)

const types = {
  transaction: { display: 'Transactions', icon: <Transaction /> },
  highValueTransaction: { display: 'Transactions', icon: <Transaction /> },
  fiatBalance: { display: 'Maintenance', icon: <Wrench /> },
  cryptoBalance: { display: 'Maintenance', icon: <Wrench /> },
  compliance: { display: 'Compliance', icon: <WarningIcon /> },
  error: { display: 'Error', icon: <WarningIcon /> }
}

const NotificationRow = ({
  id,
  type,
  detail,
  message,
  deviceName,
  created,
  read,
  valid,
  toggleClear
}) => {
  const classes = useStyles()

  const typeDisplay = R.path([type, 'display'])(types) ?? null
  const icon = R.path([type, 'icon'])(types) ?? <Wrench />
  const age = prettyMs(new Date().getTime() - new Date(created).getTime(), {
    compact: true,
    verbose: true
  })
  const notificationTitle =
    typeDisplay && deviceName
      ? `${typeDisplay} - ${deviceName}`
      : !typeDisplay && deviceName
      ? `${deviceName}`
      : `${typeDisplay}`

  return (
    <Grid
      container
      className={classnames(
        classes.notificationRow,
        !read && valid ? classes.unread : ''
      )}>
      <Grid item xs={2} className={classes.notificationRowIcon}>
        {icon}
      </Grid>
      <Grid item container xs={7} direction="row">
        <Grid item xs={12}>
          <Label2 className={classes.notificationTitle}>
            {notificationTitle}
          </Label2>
        </Grid>
        <Grid item xs={12}>
          <TL2 className={classes.notificationBody}>{message}</TL2>
        </Grid>
        <Grid item xs={12}>
          <Label1 className={classes.notificationSubtitle}>{age}</Label1>
        </Grid>
      </Grid>
      <Grid item xs={3} style={{ zIndex: 1 }}>
        {read ? (
          <div onClick={() => toggleClear(id)} className={classes.readIcon} />
        ) : (
          <div onClick={() => toggleClear(id)} className={classes.unreadIcon} />
        )}
      </Grid>
      {!valid && <StripesSvg className={classes.stripes} />}
    </Grid>
  )
}

export default NotificationRow
