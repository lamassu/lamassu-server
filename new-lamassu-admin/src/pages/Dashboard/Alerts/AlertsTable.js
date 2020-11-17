import { withStyles } from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import React from 'react'

import styles from './Alerts.styles'
// const useStyles = makeStyles(styles)

const StyledListItem = withStyles(() => ({
  root: {
    ...styles.root
  }
}))(ListItem)

const AlertsTable = ({ numToRender, alerts }) => {
  // const classes = useStyles()

  return (
    <>
      <List dense>
        {alerts.map((alert, idx) => {
          if (idx < numToRender) {
            return (
              <StyledListItem key={idx}>
                <ListItemText primary={alert.text} />
              </StyledListItem>
            )
          } else return null
        })}
      </List>
    </>
  )
}

export default AlertsTable
