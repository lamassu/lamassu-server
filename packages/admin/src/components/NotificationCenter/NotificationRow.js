import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import prettyMs from 'pretty-ms'
import * as R from 'ramda'
import React from 'react'

import { Label1, Label2, TL2 } from 'src/components/typography'
import { ReactComponent as Wrench } from 'src/styling/icons/action/wrench/zodiac.svg'
import { ReactComponent as Transaction } from 'src/styling/icons/arrow/transaction.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/tomato.svg'

import styles from './NotificationCenter.styles'
const useStyles = makeStyles(styles)

const types = {
  transaction: {
    display: 'Transactions',
    icon: <Transaction height={16} width={16} />
  },
  highValueTransaction: {
    display: 'Transactions',
    icon: <Transaction height={16} width={16} />
  },
  fiatBalance: {
    display: 'Maintenance',
    icon: <Wrench height={16} width={16} />
  },
  cryptoBalance: {
    display: 'Maintenance',
    icon: <Wrench height={16} width={16} />
  },
  compliance: {
    display: 'Compliance',
    icon: <WarningIcon height={16} width={16} />
  },
  error: { display: 'Error', icon: <WarningIcon height={16} width={16} /> }
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
  const icon = R.path([type, 'icon'])(types) ?? (
    <Wrench height={16} width={16} />
  )
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

  const iconClass = {
    [classes.readIcon]: read,
    [classes.unreadIcon]: !read
  }
  return (
    <div
      className={classnames(
        classes.notificationRow,
        !read && valid ? classes.unread : ''
      )}>
      <div className={classes.notificationRowIcon}>
        <div>{icon}</div>
      </div>
      <div className={classes.notificationContent}>
        <Label2 className={classes.notificationTitle}>
          {notificationTitle}
        </Label2>
        <TL2 className={classes.notificationBody}>{message}</TL2>
        <Label1 className={classes.notificationSubtitle}>{age}</Label1>
      </div>
      <div className={classes.readIconWrapper}>
        <div
          onClick={() => toggleClear(id)}
          className={classnames(iconClass)}
        />
      </div>
    </div>
  )
}

export default NotificationRow
