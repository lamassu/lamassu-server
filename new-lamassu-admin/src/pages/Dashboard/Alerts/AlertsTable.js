import { withStyles, makeStyles } from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import React from 'react'
import { P } from 'src/components/typography/index'
import { ReactComponent as Wrench } from 'src/styling/icons/action/wrench/zodiac.svg'
import { ReactComponent as CashBoxEmpty } from 'src/styling/icons/cassettes/cashbox-empty.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/tomato.svg'

import styles from './Alerts.styles'
const useStyles = makeStyles(styles)

const StyledListItem = withStyles(() => ({
  root: {
    ...styles.root
  }
}))(ListItem)

const icons = {
  error: <WarningIcon style={{ height: 20, width: 20, marginRight: 12 }} />,
  fiatBalance: (
    <CashBoxEmpty style={{ height: 18, width: 18, marginRight: 14 }} />
  )
}

const AlertsTable = ({ numToRender, alerts, machines }) => {
  const classes = useStyles()
  return (
    <List dense className={classes.table}>
      {alerts.map((alert, idx) => {
        if (idx < numToRender) {
          return (
            <StyledListItem key={idx}>
              {icons[alert.type] || (
                <Wrench style={{ height: 23, width: 23, marginRight: 8 }} />
              )}
              <P className={classes.listItemText}>{`${alert.message}${alert
                .detail.deviceId &&
                ' - ' + machines[alert.detail.deviceId]}`}</P>
            </StyledListItem>
          )
        } else return null
      })}
    </List>
  )
}

export default AlertsTable
