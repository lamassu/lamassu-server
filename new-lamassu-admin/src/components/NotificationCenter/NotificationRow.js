import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import prettyMs from 'pretty-ms'
import React from 'react'

import { Label1, Label2, TL2 } from 'src/components/typography'
import { ReactComponent as Wrench } from 'src/styling/icons/action/wrench/zodiac.svg'
import { ReactComponent as Transaction } from 'src/styling/icons/arrow/transaction.svg'
import { ReactComponent as StripesSvg } from 'src/styling/icons/stripes.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/tomato.svg'

import styles from './NotificationCenter.styles'
const useStyles = makeStyles(styles)

const types = {
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
  onClear
}) => {
  const classes = useStyles()

  const buildType = () => {
    return types[type].display
  }

  const buildAge = () => {
    const createdDate = new Date(created)
    const interval = +new Date() - createdDate
    return prettyMs(interval, { compact: true, verbose: true })
  }

  return (
    <Grid
      container
      className={classnames(
        classes.notificationRow,
        !read && valid ? classes.unread : ''
      )}>
      <Grid item xs={2} className={classes.notificationRowIcon}>
        {types[type].icon}
      </Grid>
      <Grid item container xs={7} direction="row">
        <Grid item xs={12}>
          <Label2 className={classes.notificationTitle}>
            {`${buildType()} ${deviceName ? '- ' + deviceName : ''}`}
          </Label2>
        </Grid>
        <Grid item xs={12}>
          <TL2 className={classes.notificationBody}>{message}</TL2>
        </Grid>
        <Grid item xs={12}>
          <Label1 className={classes.notificationSubtitle}>
            {buildAge(created)}
          </Label1>
        </Grid>
      </Grid>
      <Grid item xs={3} style={{ zIndex: 1 }}>
        {!read && (
          <div onClick={() => onClear(id)} className={classes.unreadIcon} />
        )}
      </Grid>
      {!valid && <StripesSvg className={classes.stripes} />}
    </Grid>
  )
}

export default NotificationRow
